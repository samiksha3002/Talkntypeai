"""Private gateway boundary. Runs before body parsing and resource admission."""
import hmac
import json
import os
import re
from resource_protection import ResourceProtection

class WorkspaceBoundary:
    def __init__(self, app):
        self.app = app
        self.protected = ResourceProtection(app, max_bytes=11*1024*1024, concurrency=1, timeout=600, rate=12)

    async def __call__(self, scope, receive, send):
        if scope['type'] == 'http' and scope.get('path','').startswith('/internal/legal-workspace'):
            headers = dict(scope.get('headers', []))
            key = os.environ.get('LEGAL_AI_SERVICE_KEY', '')
            supplied = headers.get(b'x-legal-service-key', b'').decode('latin1')
            owner = headers.get(b'x-legal-owner', b'').decode('latin1')
            if len(key) < 32 or not hmac.compare_digest(key, supplied) or not re.fullmatch('[a-f0-9]{24}', owner):
                await send({'type':'http.response.start','status':401,'headers':[(b'content-type',b'application/json'),(b'cache-control',b'no-store')]})
                await send({'type':'http.response.body','body':json.dumps({'detail':'Unauthorized gateway.'}).encode()})
                return
            scope['legal_owner'] = owner
            return await self.protected(scope, receive, send)
        await self.app(scope, receive, send)
