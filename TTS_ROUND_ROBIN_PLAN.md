# Plan: Client-Side Round-Robin for TTS Service Instances

## 1. Objective

This document outlines the plan to modify the application's Text-to-Speech (TTS) service to distribute its workload between two separate, identical Gradio model instances. Instead of using a single, static endpoint, the application will alternate requests between **"Tom1986/Kokoro-TTS"** and **"Tom0403309722/Kokoro-TTS"** in a round-robin fashion.

This approach serves as a simple, effective, client-side load balancing strategy that requires no external infrastructure like Cloudflare.

---

## 2. Problem Statement & Proposed Solution

**Problem:** Relying on a single Gradio instance for all TTS generation creates a performance bottleneck and a single point of failure. If the instance is under heavy load or goes down, the application's speech functionality is impaired for all users.

**Solution:** We will implement a **client-side round-robin** mechanism directly within the `ttsService.ts` file. A list of available TTS server instances will be maintained, and the application will cycle through this list for each new speech generation request.

-   Request 1 goes to Server A.
-   Request 2 goes to Server B.
-   Request 3 goes to Server A.
-   Request 4 goes to Server B.
-   ...and so on.

---

## 3. Implementation Details

All changes will be confined to a single file: `services/ttsService.ts`.

### Step 1: Replace the Single URL Constant with an Array

We will replace the single `TTS_SPACE_URL` constant with an array of strings containing the URLs of both Gradio instances.

**File:** `services/ttsService.ts`

**Current Code:**
```typescript
const TTS_SPACE_URL = "Tom1986/Kokoro-TTS";
```

**New Code:**
```typescript
// An array holding all available TTS service endpoints.
const TTS_SERVICE_ENDPOINTS = [
  "Tom1986/Kokoro-TTS",
  "Tom0403309722/Kokoro-TTS"
];
```

### Step 2: Introduce a Counter for Rotation

A module-level variable will be created to keep track of which endpoint to use next. This counter will persist between function calls.

**File:** `services/ttsService.ts`

**New Code (to be added below the array):**
```typescript
// A simple counter to enable round-robin rotation.
let currentEndpointIndex = 0;
```

### Step 3: Modify the `generateSpeech` Function

The core `generateSpeech` function will be updated to select an endpoint dynamically before making the API call.

**File:** `services/ttsService.ts`

**Current `generateSpeech` Logic:**
```typescript
export const generateSpeech = async (text: string, voice: string): Promise<string> => {
  try {
    const app = await client(TTS_SPACE_URL); // Uses the static constant
    // ... rest of the function
```

**New `generateSpeech` Logic:**
```typescript
export const generateSpeech = async (text: string, voice: string): Promise<string> => {
  // --- Round-Robin Logic Start ---
  
  // 1. Select the next endpoint from the array.
  const selectedEndpoint = TTS_SERVICE_ENDPOINTS[currentEndpointIndex];

  // 2. Log which endpoint is being used for easy debugging.
  console.log(`Routing TTS request to: ${selectedEndpoint}`);

  // 3. Increment the index for the next call, and wrap it around if it exceeds the array length.
  currentEndpointIndex = (currentEndpointIndex + 1) % TTS_SERVICE_ENDPOINTS.length;

  // --- Round-Robin Logic End ---

  try {
    // Use the dynamically selected endpoint for this request.
    const app = await client(selectedEndpoint); 

    const result = await app.predict("/generate_first", [
      text,
      voice,
      1.0,  // speed
    ]) as GradioPredictionResult;

    // ... rest of the function remains unchanged
```

---

## 4. Benefits of this Approach

-   **Simplicity:** The changes are minimal, easy to understand, and confined to a single file.
-   **Effective Load Distribution:** Evenly splits the TTS generation load between the two provided instances, improving overall throughput and responsiveness.
-   **No Infrastructure Overhead:** Avoids the complexity and cost of setting up and managing a dedicated load balancer service.
-   **Scalability:** If you deploy a third or fourth TTS instance in the future, you only need to add its URL to the `TTS_SERVICE_ENDPOINTS` array. The logic will adapt automatically.

## 5. Summary

This plan provides a clear and straightforward path to implement a robust, client-side load rotation for the TTS service. It directly addresses the performance bottleneck while maintaining a simple and easy-to-manage codebase.