"""Security tests for TNT_BRAIN (run: venv/Scripts/python -I -m unittest tests/brain_security_test.py).

Uses fake placeholder keys and fake embeddings: no OpenAI/Tavily/Indian Kanoon
calls are made and no real .env value is used (dotenv never overrides variables
that are already set).
"""
import asyncio
import os
import pathlib
import sys
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
BRAIN = ROOT / "TNT_BRAIN"
SECRET = "test-only-brain-shared-secret-0123456789"
for name, value in {
    "OPENAI_API_KEY": "test-placeholder-not-a-real-key",
    "TAVILY_API_KEY": "test-placeholder-not-a-real-key",
    "INDIAN_KANOON_API_KEY": "test-placeholder-not-a-real-key",
    "BRAIN_SHARED_SECRET": SECRET,
    "DOCUMENT_DB_TTL_SECONDS": "3600",
}.items():
    os.environ[name] = value
os.environ.pop("BRAIN_ALLOWED_ORIGINS", None)
sys.path.insert(0, str(BRAIN))

from brain_auth import BrainAuth  # noqa: E402

USER_A, USER_B = "0000000000000000000000aa", "0000000000000000000000bb"


class BrainAuthTests(unittest.IsolatedAsyncioTestCase):
    async def call(self, path="/api/chat-with-pdf", method="POST", headers=None, secret=SECRET):
        seen = {}

        async def app(scope, receive, send):
            seen["user"] = scope.get("state", {}).get("user_id")
            await send({"type": "http.response.start", "status": 200, "headers": []})
            await send({"type": "http.response.body", "body": b"ok"})

        sent = []

        async def send(message):
            sent.append(message)

        async def receive():
            return {"type": "http.request", "body": b"", "more_body": False}

        raw = [(k.lower().encode(), v.encode()) for k, v in (headers or {}).items()]
        await BrainAuth(app, lambda: secret)({"type": "http", "method": method, "path": path, "headers": raw}, receive, send)
        return sent[0]["status"], seen.get("user")

    async def test_rejects_missing_or_wrong_secret(self):
        self.assertEqual((await self.call())[0], 401)
        self.assertEqual((await self.call(headers={"X-Brain-Secret": "wrong", "X-User-Id": USER_A}))[0], 401)
        self.assertEqual((await self.call(headers={"X-Brain-Secret": SECRET[:-1], "X-User-Id": USER_A}))[0], 401)

    async def test_requires_a_valid_user_id(self):
        for user in ["", "not-an-id", "../../etc", USER_A + "0"]:
            self.assertEqual((await self.call(headers={"X-Brain-Secret": SECRET, "X-User-Id": user}))[0], 400)

    async def test_passes_verified_user_to_the_app(self):
        self.assertEqual(await self.call(headers={"X-Brain-Secret": SECRET, "X-User-Id": USER_A}), (200, USER_A))

    async def test_fails_closed_without_configured_secret(self):
        self.assertEqual((await self.call(headers={"X-Brain-Secret": "", "X-User-Id": USER_A}, secret=None))[0], 503)

    async def test_only_get_health_is_public(self):
        self.assertEqual((await self.call(path="/health", method="GET"))[0], 200)
        self.assertEqual((await self.call(path="/health", method="POST"))[0], 401)
        self.assertEqual((await self.call(path="/", method="GET"))[0], 401)


class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.cwd = os.getcwd()
        os.chdir(cls.tmp.name)   # uploads/ and temp_db/ are created here, not in the repo
        import server  # noqa: E402
        from starlette.testclient import TestClient
        cls.server = server
        cls.client = TestClient(server.app)

    @classmethod
    def tearDownClass(cls):
        os.chdir(cls.cwd)
        cls.tmp.cleanup()

    def headers(self, user=USER_A):
        return {"X-Brain-Secret": SECRET, "X-User-Id": user}

    def test_health_is_public_and_reveals_nothing(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})

    def test_endpoints_refuse_direct_internet_requests(self):
        for path in ["/api/chat-with-pdf", "/api/analyze-document", "/api/generate-legal-draft",
                     "/api/generate-legal-draft-stream", "/api/ai-command", "/api/legal-research",
                     "/api/translate-research-marathi"]:
            self.assertEqual(self.client.post(path, json={}).status_code, 401, path)
            self.assertEqual(self.client.post(path, json={}, headers={"X-Brain-Secret": "guess", "X-User-Id": USER_A}).status_code, 401, path)

    def test_legacy_document_endpoints_stay_contained_even_with_valid_gateway_headers(self):
        # Merge note: main's DocumentContainment suspends the shared-document endpoints;
        # per-user isolation of DocumentService is covered by DocumentIsolationTests.
        for path in ["/api/chat-with-pdf", "/api/analyze-document", "/api/generate-legal-draft", "/api/generate-legal-draft-stream"]:
            self.assertEqual(self.client.post(path, json={"query": "x"}, headers=self.headers(USER_B)).status_code, 503, path)

    def test_legal_workspace_gateway_is_guarded_by_its_own_key(self):
        # BrainAuth hands /internal/legal-workspace/* to main's WorkspaceBoundary,
        # which still refuses requests without X-Legal-Service-Key / X-Legal-Owner.
        for headers in [{}, self.headers(), {"X-Legal-Service-Key": "guess", "X-Legal-Owner": USER_A}]:
            response = self.client.post("/internal/legal-workspace/chat-with-pdf", json={"query": "x"}, headers=headers)
            self.assertEqual(response.status_code, 401)

    def test_separate_python_login_and_register_were_removed(self):
        for path in ["/api/login", "/api/register"]:
            self.assertEqual(self.client.post(path, json={"email": "a@b.c", "password": "x" * 10}, headers=self.headers()).status_code, 404)

    def test_cors_is_limited_to_our_domains(self):
        self.assertEqual(self.server.ALLOWED_ORIGINS, ["https://talkntype.pro", "https://www.talkntype.pro"])
        preflight = self.client.options("/api/chat-with-pdf", headers={
            "Origin": "https://evil.example", "Access-Control-Request-Method": "POST"})
        self.assertNotEqual(preflight.headers.get("access-control-allow-origin"), "https://evil.example")
        self.assertNotEqual(preflight.headers.get("access-control-allow-origin"), "*")


def make_pdf(path, text):
    import fitz
    with fitz.open() as pdf:
        page = pdf.new_page()
        page.insert_textbox(fitz.Rect(40, 40, 560, 800), text, fontsize=11)
        pdf.save(path)


class DocumentIsolationTests(unittest.TestCase):
    def setUp(self):
        from langchain_core.embeddings import DeterministicFakeEmbedding
        from services.document_service import DocumentService
        self.tmp = tempfile.TemporaryDirectory()
        os.environ["DOCUMENT_DB_DIR"] = os.path.join(self.tmp.name, "temp_db")
        os.makedirs(os.environ["DOCUMENT_DB_DIR"])
        self.legacy = os.path.join(os.environ["DOCUMENT_DB_DIR"], "doc_" + "f" * 32)
        os.makedirs(self.legacy)
        self.Service = DocumentService
        self.fake = DeterministicFakeEmbedding(size=32)
        self.service = self.new_service()
        self.pdf_a = os.path.join(self.tmp.name, "a.pdf")
        self.pdf_b = os.path.join(self.tmp.name, "b.pdf")
        make_pdf(self.pdf_a, "CONFIDENTIAL-ALPHA petitioner Ramesh. " * 20)
        make_pdf(self.pdf_b, "CONFIDENTIAL-BRAVO respondent Suresh. " * 20)

    def new_service(self):
        service = self.Service()
        service.embeddings = self.fake
        return service

    def tearDown(self):
        for service in [self.service, getattr(self, "restarted", None)]:
            if service is None:
                continue
            for store in list(service._stores.values()):
                if store.timer:
                    store.timer.cancel()
                service._release(store)
        self.tmp.cleanup()

    def text_of(self, db):
        return " ".join(doc.page_content for doc in db.similarity_search("petitioner respondent", k=5))

    def test_each_user_only_sees_their_own_document(self):
        self.assertFalse(os.path.exists(self.legacy), "old shared-document folder must be removed")
        db_a = self.service.process_pdf(self.pdf_a, USER_A)
        db_b = self.service.process_pdf(self.pdf_b, USER_B)
        self.assertIsNotNone(db_a)
        self.assertIsNotNone(db_b)
        text_a = self.text_of(self.service.get_db(USER_A))
        text_b = self.text_of(self.service.get_db(USER_B))
        self.assertIn("ALPHA", text_a)
        self.assertNotIn("BRAVO", text_a)
        self.assertIn("BRAVO", text_b)
        self.assertNotIn("ALPHA", text_b)
        self.assertIsNone(self.service.get_db("0000000000000000000000cc"))

    def test_upload_by_one_user_never_deletes_another_users_document(self):
        self.service.process_pdf(self.pdf_a, USER_A)
        folder_a = self.service._store(USER_A).folder
        self.service.process_pdf(self.pdf_b, USER_B)
        self.service.process_pdf(self.pdf_b, USER_B)   # B replaces their own document
        self.assertTrue(os.path.isdir(folder_a))
        self.assertIn("ALPHA", self.text_of(self.service.get_db(USER_A)))
        self.assertEqual(len(self.service._owner_folders(USER_B)), 1)

    def test_chat_and_draft_uploads_of_the_same_user_are_separate(self):
        self.service.process_pdf(self.pdf_a, USER_A)
        self.service.process_pdf(self.pdf_b, USER_A + ":draft")
        self.assertIn("ALPHA", self.text_of(self.service.get_db(USER_A)))
        self.assertIn("BRAVO", self.text_of(self.service.get_db(USER_A + ":draft")))

    def test_after_restart_documents_reload_only_for_their_owner(self):
        self.service.process_pdf(self.pdf_a, USER_A)
        self.restarted = self.new_service()
        self.assertIn("ALPHA", self.text_of(self.restarted.get_db(USER_A)))
        self.assertIsNone(self.restarted.get_db(USER_B))

    def test_question_answering_uses_only_the_owners_excerpts(self):
        captured = {}

        class FakeLLM:
            def invoke(self, messages):
                captured["prompt"] = messages[-1].content
                return type("R", (), {"content": "answer"})()

        self.service.llm_answer = FakeLLM()
        self.service.process_pdf(self.pdf_a, USER_A)
        self.service.process_pdf(self.pdf_b, USER_B)
        answer = self.service.ask_question(self.service.get_db(USER_B), "Who is the respondent?", [], USER_B)
        self.assertEqual(answer, "answer")
        self.assertIn("BRAVO", captured["prompt"])
        self.assertNotIn("ALPHA", captured["prompt"])

    def test_owner_values_cannot_escape_the_document_folder(self):
        for owner in ["", "../x", "a/b", "x" * 101, None]:
            with self.assertRaises(ValueError):
                self.service.owner_key(owner)


if __name__ == "__main__":
    unittest.main()
