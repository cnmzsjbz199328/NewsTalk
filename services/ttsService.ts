import { client } from '@gradio/client';

// Define the type for the prediction result's data structure
// This helps with type safety when accessing the response.
type GradioPredictionResult = {
  data: [
    {
      url?: string;
      name?: string; // The Gradio client can return 'name' (path) or 'url' (full url)
    }
  ]
};

const TTS_SPACE_URL = "Tom1986/Kokoro-TTS";
const TTS_FILE_BASE_URL = "https://tom1986-kokoro-tts.hf.space/file=";

export const generateSpeech = async (text: string, voice: string): Promise<string> => {
  try {
    const app = await client(TTS_SPACE_URL);

    // The predict method's return type is now explicitly cast for better type-checking.
    const result = await app.predict("/generate_first", [
      text,
      voice,
      1.0,  // speed
    ]) as GradioPredictionResult;

    const output = result.data?.[0];

    if (output?.url) {
      // If the client returns a full URL, use it directly.
      return output.url;
    } else if (output?.name) {
      // If it returns a file path, construct the URL.
      return TTS_FILE_BASE_URL + output.name;
    } else {
      console.error("Invalid TTS API response from Gradio client:", result);
      throw new Error("Could not find audio file path or URL in the response from TTS API");
    }
  } catch (error) {
    console.error("Error generating speech with Gradio client:", error);
    
    let errorMessage = String(error);
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
        // Avoid [object Object] by stringifying.
        errorMessage = JSON.stringify(error);
    }
    
    if (errorMessage.includes('Space is starting up')) {
      throw new Error('TTS service is starting up, please try again in a moment.');
    }

    // Always throw a standard Error object.
    throw new Error(errorMessage);
  }
};