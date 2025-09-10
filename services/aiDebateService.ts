import { client } from '@gradio/client';
import { Sender, Message, Settings } from '../types';
import { MODEL_TOM_ID, MODEL_MARK_ID, MODEL_SAM_ID } from '../constants';

// Module-level variables to hold the Gradio client instances
let appTom: any = null;
let appMark: any = null;
let appSam: any = null;

/**
 * Connects to the three separate AI debater models on Hugging Face Spaces.
 * This function is idempotent and will not reconnect if already connected.
 */
export const connectToDebaters = async (): Promise<void> => {
  if (appTom && appMark && appSam) {
    console.log("Models already connected.");
    return;
  }
  
  try {
    console.log("Connecting to AI Debaters...");
    [appTom, appMark, appSam] = await Promise.all([
      client(MODEL_TOM_ID),
      client(MODEL_MARK_ID),
      client(MODEL_SAM_ID),
    ]);
    console.log("Successfully connected to all three models.");
  } catch (error) {
    console.error("Failed to connect to one or more models:", error);
    // Reset any partially successful connections
    appTom = appMark = appSam = null;
    if (error instanceof Error) {
      throw new Error(`Connection Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred during model connection.");
  }
};

const getAiResponse = async (
  app: any,
  endpoint: '/predict' | '/chat',
  payload: Record<string, any>
): Promise<string> => {
  if (!app) {
    throw new Error("Gradio client is not connected.");
  }
  const result: any = await app.predict(endpoint, payload);
  const responseData = Array.isArray(result.data) ? result.data[0] : result.data;
  
  if (typeof responseData === 'string') {
    return responseData.trim();
  }
  
  console.warn("Received non-string response from model:", responseData);
  return JSON.stringify(responseData);
};


const createPromptForModel = (model: Sender, history: Message[], settings: Settings) => {
  const { contextTurns, charLimit } = settings;
  const limitedHistory = history.slice(-contextTurns * 3);
  let historyText = limitedHistory.map(turn => `${turn.sender}: ${turn.text}`).join('\n');
  
  switch(model) {
    case Sender.Tom:
      return `You are Tom, an optimistic debater. Based on the last statements:\n${historyText}\n\nDirectly state your insightful, optimistic argument in under ${charLimit} characters. Do not include any preamble (e.g., "Okay, here's my response:"). Your response must end with a challenging question for the others.`;
    case Sender.Mark:
      return `You are Mark, a skeptical debater. Based on the last statements:\n${historyText}\n\nDirectly state your concise, skeptical counter-argument in under ${charLimit} characters. Do not use introductory phrases. Your response must end with a challenging question.`;
    case Sender.Sam:
      return `You are Sam, a pragmatic debater. Based on the last statements:\n${historyText}\n\nDirectly state your balanced, pragmatic rebuttal in under ${charLimit} characters. Avoid conversational filler. Your response must end with a clarifying question.`;
    default:
      return "";
  }
};

export const getTomResponse = (history: Message[], settings: Settings) => {
    const prompt = createPromptForModel(Sender.Tom, history, settings);
    const max_tokens = Math.ceil(settings.charLimit / 2.2);
    return getAiResponse(appTom, '/predict', { message: prompt, max_tokens });
};

export const getMarkResponse = (history: Message[], settings: Settings) => {
    const prompt = createPromptForModel(Sender.Mark, history, settings);
    // Model B uses the /chat endpoint and doesn't seem to take max_tokens in the example
    return getAiResponse(appMark, '/chat', { message: prompt });
};

export const getSamResponse = (history: Message[], settings: Settings) => {
    const prompt = createPromptForModel(Sender.Sam, history, settings);
    const max_tokens = Math.ceil(settings.charLimit / 2.2);
    return getAiResponse(appSam, '/predict', { message: prompt, max_tokens });
};