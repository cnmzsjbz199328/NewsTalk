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

// An array holding all available TTS service endpoints for rotation.
const TTS_SERVICE_ENDPOINTS = [
  "Tom1986/Kokoro-TTS",
  "Tom0403309722/Kokoro-TTS"
];

// A counter to enable round-robin rotation for subsequent requests.
let nextEndpointIndex = 0;

export const generateSpeech = async (text: string, voice: string): Promise<string> => {
  const startIndex = nextEndpointIndex;
  let lastError: Error | null = null;

  // Loop through all available endpoints, starting from the next one in the queue.
  // This loop acts as a retry mechanism if one endpoint fails.
  for (let i = 0; i < TTS_SERVICE_ENDPOINTS.length; i++) {
    const currentIndex = (startIndex + i) % TTS_SERVICE_ENDPOINTS.length;
    const endpoint = TTS_SERVICE_ENDPOINTS[currentIndex];
    
    try {
      console.log(`[Attempt ${i + 1}/${TTS_SERVICE_ENDPOINTS.length}] Routing TTS request to: ${endpoint}`);
      
      const app = await client(endpoint);

      const result = await app.predict("/generate_first", [
        text,
        voice,
        1.0,  // speed
      ]) as GradioPredictionResult;

      const output = result.data?.[0];

      // If successful, update the index for the *next* top-level call to start there.
      nextEndpointIndex = (currentIndex + 1) % TTS_SERVICE_ENDPOINTS.length;

      if (output?.url) {
        return output.url;
      } else if (output?.name) {
        // Construct the base URL dynamically from the endpoint ID
        const baseUrl = `https://${endpoint.replace('/', '-')}.hf.space/file=`;
        return baseUrl + output.name;
      } else {
        // This case is for a successful request but an invalid response format.
        console.error("Invalid TTS API response from Gradio client:", result);
        throw new Error("Could not find audio file path or URL in the response from TTS API");
      }

    } catch (error) {
      console.warn(`Endpoint ${endpoint} failed.`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      // Continue the loop to try the next endpoint.
    }
  }
  
  // If the loop completes, it means all endpoints have failed.
  console.error("All TTS endpoints failed after retries.");
  const finalErrorMessage = `TTS generation failed on all available services. Last error: ${lastError?.message}`;
  
  if (lastError?.message.includes('Space is starting up')) {
      throw new Error('All TTS services are starting up, please try again in a moment.');
  }

  throw new Error(finalErrorMessage);
};
