import { Sender } from './types';

// --- Hugging Face Model IDs ---
export const MODEL_TOM_ID = "Tom199328/gemma-3";
export const MODEL_MARK_ID = "Tom1986/gemma-3-270m-chat";
export const MODEL_SAM_ID = "Tom1986/gemma-3-270m";

export const KOKORO_TTS_VOICES = [
    { id: 'af_heart', name: 'Heart (Female)' },
    { id: 'af_bella', name: 'Bella (Female)' },
    { id: 'af_nicole', name: 'Nicole (Female)' },
    { id: 'af_aoede', name: 'Aoede (Female)' },
    { id: 'af_kore', name: 'Kore (Female)' },
    { id: 'af_sarah', name: 'Sarah (Female)' },
    { id: 'af_nova', name: 'Nova (Female)' },
    { id: 'af_sky', name: 'Sky (Female)' },
    { id: 'af_alloy', name: 'Alloy (Female)' },
    { id: 'af_jessica', name: 'Jessica (Female)' },
    { id: 'af_river', name: 'River (Female)' },
    { id: 'am_michael', name: 'Michael (Male)' },
    { id: 'am_fenrir', name: 'Fenrir (Male)' },
    { id: 'am_puck', name: 'Puck (Male)' },
    { id: 'am_echo', name: 'Echo (Male)' },
    { id: 'am_eric', name: 'Eric (Male)' },
    { id: 'am_liam', name: 'Liam (Male)' },
    { id: 'am_onyx', name: 'Onyx (Male)' },
    { id: 'am_santa', name: 'Santa (Male)' },
    { id: 'am_adam', name: 'Adam (Male)' },
    { id: 'bf_emma', name: 'Emma (Female UK)' },
    { id: 'bf_isabella', name: 'Isabella (Female UK)' },
    { id: 'bf_alice', name: 'Alice (Female UK)' },
    { id: 'bf_lily', name: 'Lily (Female UK)' },
    { id: 'bm_george', name: 'George (Male UK)' },
    { id: 'bm_fable', name: 'Fable (Male UK)' },
    { id: 'bm_lewis', name: 'Lewis (Male UK)' },
    { id: 'bm_daniel', name: 'Daniel (Male UK)' },
];


export const SENDER_DETAILS: Record<Sender, { name: string; voice: string; color: string; modelId?: string; }> = {
  [Sender.System]: {
    name: 'System',
    voice: 'N/A',
    color: 'bg-transparent',
  },
  [Sender.Tom]: {
    name: 'Tom (The Optimist)',
    voice: 'bm_daniel', // Default voice
    color: 'bg-sky-500/10 border-sky-500/30',
    modelId: MODEL_TOM_ID,
  },
  [Sender.Mark]: {
    name: 'Mark (The Skeptic)',
    voice: 'bm_george', // Default voice
    color: 'bg-rose-500/10 border-rose-500/30',
    modelId: MODEL_MARK_ID,
  },
  [Sender.Sam]: {
    name: 'Sam (The Pragmatist)',
    voice: 'am_eric', // Default voice
    color: 'bg-emerald-500/10 border-emerald-500/30',
    modelId: MODEL_SAM_ID,
  },
};

export const NEWS_FEED_URL = "http://feeds.bbci.co.uk/news/rss.xml";
// Note: This proxy can be unreliable. For production, a self-hosted or more robust proxy is recommended.
export const CORS_PROXY_URL = "https://api.allorigins.win/raw?url=";
export const USE_PROXY = true; // Set to true to use the proxy for fetching news feed