import { resolveDraftApi } from '../LegalHubMain/draftClient.js';
const getNodeApi = async () => resolveDraftApi(import.meta.env?.VITE_DRAFT_API_URL);
import { readDraftSession } from '../LegalHubMain/draftClient.js';
const actions = new Set(['analyze-document','chat-with-pdf','generate-legal-draft-stream','ai-command']);
export async function workspaceFetch(path, options = {}) {
  const action = path.split('/').pop();
  if (!actions.has(action)) throw Error('Unsupported AI operation.');
  const token = readDraftSession();
  if (!token) throw Error('Sign in again to use this workspace.');
  const response = await fetch((await getNodeApi()) + '/legal-workspace/' + action, {
    ...options, cache:'no-store', redirect:'error', signal:options.signal || AbortSignal.timeout(600000),
    headers:{...options.headers,Authorization:'Bearer ' + token}
  });
  if (token !== readDraftSession()) { await response.body?.cancel(); throw Error('Session changed. Sign in again.'); }
  if (!response.body) return response;
  const reader = response.body.getReader();
  const body = new ReadableStream({
    async pull(controller) {
      try {
        const result = await reader.read();
        if (token !== readDraftSession()) { await reader.cancel(); throw Error('Session changed. Sign in again.'); }
        if (result.done) controller.close(); else controller.enqueue(result.value);
      } catch (error) { controller.error(error); }
    },
    cancel(reason) { return reader.cancel(reason); }
  });
  return new Response(body,{status:response.status,headers:response.headers});
}
