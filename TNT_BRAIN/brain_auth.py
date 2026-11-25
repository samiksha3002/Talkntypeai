"""Only the Node API may call this service.

Every request except GET /health must carry:
  X-Brain-Secret: <BRAIN_SHARED_SECRET>   (shared only between Node and Python)
  X-User-Id:      <24-hex user id>         (verified by Node from the user's JWT)

The user id is exposed to endpoints as request.state.user_id. If the secret is
not configured (or shorter than 32 characters) every request is refused, so a
misconfigured deployment fails closed instead of becoming public.
"""
import hmac
import json
import os
import re

PUBLIC_PATHS = {"/health"}
USER_ID = re.compile(r"^[a-f0-9]{24}$")


def configured_secret():
    secret = os.getenv("BRAIN_SHARED_SECRET", "")
    return secret if len(secret) >= 32 else None


class BrainAuth:
    def __init__(self, app, secret_getter=configured_secret):
        self.app = app
        self.secret_getter = secret_getter

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or (scope.get("method") == "GET" and scope.get("path") in PUBLIC_PATHS):
            return await self.app(scope, receive, send)
        secret = self.secret_getter()
        if not secret:
            return await self._reject(send, 503, "Service is not configured.")
        headers = {key.decode("latin-1").lower(): value.decode("latin-1") for key, value in scope.get("headers", [])}
        supplied = headers.get("x-brain-secret", "")
        if not supplied or not hmac.compare_digest(supplied.encode(), secret.encode()):
            return await self._reject(send, 401, "Unauthorized.")
        user_id = headers.get("x-user-id", "")
        if not USER_ID.match(user_id):
            return await self._reject(send, 400, "Missing user context.")
        scope.setdefault("state", {})["user_id"] = user_id
        return await self.app(scope, receive, send)

    @staticmethod
    async def _reject(send, status, message):
        body = json.dumps({"detail": message}).encode()
        await send({"type": "http.response.start", "status": status,
                    "headers": [(b"content-type", b"application/json"), (b"content-length", str(len(body)).encode())]})
        await send({"type": "http.response.body", "body": body})
