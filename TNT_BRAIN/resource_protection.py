"""Offline-testable ASGI admission/body budgets. Not authentication."""
import asyncio
import json
import os
import tempfile
import time
from collections import OrderedDict


def setting(name, default):
    value = int(os.environ.get(name, default))
    if value < 1:
        raise ValueError(f"Invalid {name}")
    return value


class ResourceProtection:
    def __init__(self, app, max_bytes=None, concurrency=None, timeout=None, rate=None):
        self.app = app
        self.max_bytes = max_bytes or setting("BRAIN_BODY_MB", 51) * 1024 * 1024
        self.concurrency = concurrency or setting("BRAIN_CONCURRENCY", 2)
        self.timeout = timeout or setting("BRAIN_TIMEOUT_SECONDS", 600)
        self.rate = rate or setting("BRAIN_REQUESTS_PER_MINUTE", 30)
        self.active = 0
        self.clients = OrderedDict()

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope.get("method") != "POST" or scope.get("path") in ("/api/login", "/api/register"):
            return await self.app(scope, receive, send)

        async def error(status, message):
            await send({"type": "http.response.start", "status": status, "headers": [(b"content-type", b"application/json")]})
            await send({"type": "http.response.body", "body": json.dumps({"detail": message}).encode()})

        now = time.monotonic()
        key = (scope.get("client") or ("unknown",))[0]
        start, count = self.clients.pop(key, (now, 0))
        count = count + 1 if now - start < 60 else 1
        self.clients[key] = (start if now-start < 60 else now, count)
        while len(self.clients) > 10000:
            self.clients.popitem(last=False)
        if count > self.rate:
            return await error(429, "AI request limit exceeded.")
        if self.active >= self.concurrency:
            return await error(503, "Processing capacity is busy. Retry shortly.")
        self.active += 1
        try:
            # Bound chunked requests as well as Content-Length, before multipart parsing.
            with tempfile.SpooledTemporaryFile(max_size=1024*1024) as body:
                total = 0
                deadline = asyncio.get_running_loop().time() + self.timeout
                while True:
                    try:
                        message = await asyncio.wait_for(receive(), max(0.001, deadline - asyncio.get_running_loop().time()))
                    except asyncio.TimeoutError:
                        return await error(408, "Upload timed out.")
                    if message["type"] == "http.disconnect":
                        return
                    chunk = message.get("body", b"")
                    total += len(chunk)
                    if total > self.max_bytes:
                        return await error(413, "Request exceeds the configured size limit.")
                    body.write(chunk)
                    if not message.get("more_body", False):
                        break
                body.seek(0)
                remaining = total
                initial = True
                async def replay():
                    nonlocal remaining, initial
                    if remaining or initial:
                        initial = False
                        chunk = body.read(min(65536, remaining))
                        remaining -= len(chunk)
                        return {"type":"http.request", "body":chunk, "more_body":remaining > 0}
                    # Response streaming needs the actual disconnect notification.
                    return await receive()
                started = False
                expired = False
                async def guarded_send(message):
                    nonlocal started
                    if not expired:
                        if message["type"] == "http.response.start":
                            started = True
                        await send(message)
                task = asyncio.create_task(self.app(scope, replay, guarded_send))
                done, _ = await asyncio.wait({task}, timeout=self.timeout)
                if not done:
                    expired = True
                    if not started:
                        await error(504, "AI processing timed out.")
                    else:
                        await send({"type":"http.response.body", "body":b"", "more_body":False})
                # Keep the slot until underlying work settles, even after timeout.
                await task
        finally:
            self.active -= 1
