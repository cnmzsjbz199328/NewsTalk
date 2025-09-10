# Plan: Refactor from Gemini to a Three-Model Gradio Architecture

**Objective:** Replace the current AI backend, which uses a single Google Gemini model, with a multi-model system that connects to three separate Gradio clients hosted on Hugging Face Spaces, as per the user's provided example.

---

### Phase 1: Configuration and Constants (`constants.ts`)

1.  **Define Model IDs:**
    *   Introduce three new constants to hold the Hugging Face Space IDs for each debater:
        *   `MODEL_TOM_ID = "Tom199328/gemma-3"`
        *   `MODEL_MARK_ID = "Tom1986/gemma-3-270m-chat"`
        *   `MODEL_SAM_ID = "Tom1986/gemma-3-270m"`
2.  **Update Sender Details:**
    *   Modify the `SENDER_DETAILS` object to associate each debater (`Tom`, `Mark`, `Sam`) with their respective model ID. This will make the service layer code cleaner and more maintainable.

---

### Phase 2: AI Service Layer Refactor (`services/aiDebateService.ts`)

This is the most critical part of the refactor. The entire file will be rewritten to remove `@google/genai` and implement `@gradio/client`.

1.  **Connection Management:**
    *   Create three module-level variables to hold the connected Gradio client instances (e.g., `appTom`, `appMark`, `appSam`).
    *   Implement a new, exported function `connectToDebaters()`.
        *   This function will be `async` and will check if the clients are already connected.
        *   If not connected, it will use `Promise.all` to connect to all three Hugging Face Spaces in parallel using `client.connect()`.
        *   It will store the successful connections in the module-level variables.
        *   It will return a status indicating success or failure, including any error messages. This function will be called from the main `App` component.

2.  **API Call Logic:**
    *   Rewrite `getTomResponse`, `getMarkResponse`, and `getSamResponse`.
    *   These functions will no longer call Gemini. Instead, they will:
        *   Check if the corresponding Gradio client (`appTom`, etc.) is connected. If not, throw an error.
        *   Use the client's `predict()` method to call the appropriate API endpoint.
            *   Tom (Model A) will call `/predict`.
            *   Mark (Model B) will call `/chat`.
            *   Sam (Model C) will call `/predict`.
        *   Construct the correct payload for each model based on the example file (e.g., `{ message: prompt, max_tokens: ... }`).
        *   Parse the response data correctly, handling the case where the result might be `result.data[0]` or just `result.data`.
        *   Return the final text string.

3.  **Prompting Logic:**
    *   The `createPromptForModel` function is largely reusable. It will be adjusted to match the specific prompting strategies from the user's example file.

---

### Phase 3: Application Layer Integration (`App.tsx`)

1.  **State Management for Connections:**
    *   Introduce new state variables to manage the connection process:
        *   `areModelsConnected: boolean` (default: `false`)
        *   `isConnecting: boolean` (default: `false`)
        *   `connectionError: string | null` (default: `null`)
2.  **Connection Lifecycle:**
    *   Modify the `handleStart` function. Before starting the debate, it must ensure the models are connected.
    *   The first time the user clicks "Start", the app will:
        *   Set `isConnecting` to `true`.
        *   Display a system message like "Connecting to AI debaters...".
        *   Call the `connectToDebaters()` function from the service.
        *   On success, set `isConnecting` to `false`, `areModelsConnected` to `true`, and proceed with the debate.
        *   On failure, set `isConnecting` to `false`, store the error message, and display it to the user.
3.  **UI Feedback:**
    *   The "Start" button in `ChatInput` must be disabled while `isConnecting` is true.
    *   System messages (`addMessage`) will be used to provide clear feedback to the user about the connection status ("Connecting...", "Connection successful!", "Connection failed: ...").
4.  **Debate Loop:**
    *   The core `debateLoop` logic will remain similar, but it now relies on the completely refactored service functions. No major changes should be needed here, demonstrating the value of service-layer abstraction.

---

### Phase 4: Component Prop Updates (`components/ChatInput.tsx`)

1.  **Pass Down Connection State:**
    *   The `App` component will pass the new `isConnecting` state down to the `ChatInput` component as a prop.
2.  **Update Disabled Logic:**
    *   The `disabled` attribute of the "Start" button will be updated to include `isConnecting`.

By following this plan, we will systematically replace the application's core AI logic to perfectly match your three-model architecture, ensuring a robust and well-integrated solution.
