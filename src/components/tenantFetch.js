import { resolveDraftApi, readDraftSession } from '../Features/LegalHubMain/draftClient.js';
export async function tenantFetch(input, options={}) {
  const target=new URL(input,window.location.origin);
  if(!/^\/api\/(cases|clients|reports|csv-manager)(\/|$)/.test(target.pathname))throw new Error('Unsupported authenticated workflow.');
  const base=resolveDraftApi(import.meta.env?.VITE_DRAFT_API_URL),token=readDraftSession();
  if(!token)throw new Error('Sign in again to access your records securely.');
  const controller=new AbortController(),abort=()=>controller.abort();
  const timer=setTimeout(abort,20000);options.signal?.addEventListener('abort',abort,{once:true});if(options.signal?.aborted)abort();
  try {
  const response=await fetch(base+target.pathname.slice(4)+target.search,{...options,signal:controller.signal,cache:'no-store',redirect:'error',headers:{...options.headers,Authorization:'Bearer '+token}});
  if(readDraftSession()!==token)throw new Error('Your session changed. Sign in again.');
  if(!response.ok)throw new Error(response.status===401?'Session expired. Sign in again.':'Request failed ('+response.status+'). Reload to confirm the latest saved state before retrying.');
  return response;
  }finally{clearTimeout(timer);options.signal?.removeEventListener('abort',abort);}
}
