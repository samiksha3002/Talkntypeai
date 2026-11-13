// Do not return a provider secret to browser code. Temporary containment.
export async function getSpeechCredential() {
  throw new Error('Deepgram dictation is temporarily unavailable for security maintenance. Browser speech remains available in supported languages.');
}
