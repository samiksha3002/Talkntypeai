import DOMPurify from 'dompurify';

// Shared by both the screen and print document; no external resources or CSS.
export function sanitizeJudgementHtml(value) {
  return DOMPurify.sanitize(String(value??''),{
    ALLOWED_TAGS:['p','div','span','h1','h2','h3','h4','h5','h6','br','hr','ul','ol','li','table','thead','tbody','tfoot','tr','th','td','caption','strong','b','em','i','u','s','sup','sub','blockquote','pre','code','a'],
    ALLOWED_ATTR:['href','title','colspan','rowspan','scope'],
    ADD_URI_SAFE_ATTR:['title','colspan','rowspan','scope'],
    ALLOW_DATA_ATTR:false,ALLOW_ARIA_ATTR:false,
    ALLOWED_URI_REGEXP:/^(?:https?:|mailto:|#|\/(?!\/))/i,
  });
}
export const escapeJudgementText=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
