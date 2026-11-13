"""Fail closed before parsing bodies or touching shared document/provider state."""
import json

class DocumentContainment:
    paths = {'/api/analyze-document', '/api/chat-with-pdf', '/api/generate-legal-draft', '/api/generate-legal-draft-stream'}
    def __init__(self, app):
        self.app = app
    async def __call__(self, scope, receive, send):
        if scope['type'] == 'http' and scope.get('path', '').rstrip('/').lower() in self.paths:
            await send({'type':'http.response.start','status':503,'headers':[(b'content-type',b'application/json'),(b'cache-control',b'no-store')]})
            await send({'type':'http.response.body','body':json.dumps({'detail':'Document features are temporarily unavailable for security maintenance.'}).encode()})
            return
        await self.app(scope, receive, send)
