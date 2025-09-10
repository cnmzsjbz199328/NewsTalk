# Implementation Plan: Refactoring to a Decoupled Asynchronous Pipeline

## 1. Objective

Refactor the core debate logic in `App.tsx` to fully implement the advanced, decoupled producer-consumer model described in `ALGORITHM.md`. This will eliminate existing bottlenecks, maximize parallelism, and create a truly seamless and responsive user experience.

## 2. Problem with Current Model

The current `debateLoop` is a "look-ahead-by-one" pipeline, which is an improvement over a purely serial model. However, it is still fundamentally a single, monolithic loop. Its primary bottleneck is the `await playAudio()` call, which blocks the entire process until the current speaker has finished. This prevents the "assembly line" from running continuously and efficiently in the background.

## 3. The New Architecture: Producers & Consumer

We will replace the single loop with three independent, state-driven processes orchestrated through a central queue. This mirrors a real-world assembly line.

1.  **The Turn Queue (The "Conveyor Belt"):**
    *   A new state variable, `turnQueue: Turn[]`, will be the single source of truth for the debate flow.
    *   A new `Turn` type will be defined, containing the debater's `sender`, `text`, `audioSrc`, and a `status` (e.g., `pending_text`, `text_ready`, `pending_audio`, `audio_ready`, `playing`) that tracks its progress through the pipeline.

2.  **The Text Producer (The "Writer"):**
    *   This process, managed by a `useEffect` hook, will continuously monitor the `turnQueue`.
    *   Its goal is to ensure the queue always has upcoming work. If the number of turns waiting for text is below a certain threshold (e.g., 2), it will automatically trigger a request to generate text for the next debater in the sequence.
    *   It will update the `speaking` state to show the "thinking" animation for the correct debater.

3.  **The Audio Producer (The "Voice Actor"):**
    *   This independent process, also a `useEffect` hook, will watch the `turnQueue`.
    *   As soon as it sees a `Turn` with the status `text_ready`, it will immediately begin generating the corresponding audio in the background.
    *   Once the audio is ready, it will update the `Turn` object in the queue with the `audioSrc` and change its status to `audio_ready`.

4.  **The UI Consumer (The "Stage Director"):**
    *   This final process (`useEffect` hook) is responsible for what the user sees and hears.
    *   It only looks at the **first** item in the queue.
    *   If that item's status is `audio_ready` and nothing else is currently playing, it will:
        1.  Add the message text to the chat UI.
        2.  Begin playing the audio.
        3.  Set a `nowPlaying` state to highlight the speaker's message bubble.
        4.  Upon audio completion, it removes the finished `Turn` from the front of the queue, allowing it to process the next fully prepared turn.

## 4. Implementation Steps

-   **`types.ts`**: Define the new `Turn` interface and `TurnStatus` enum.
-   **`App.tsx`**:
    -   Remove the existing `debateLoop` function entirely.
    -   Introduce the new state variables: `turnQueue` and `nowPlaying`.
    -   Implement the three separate `useEffect` hooks described above to manage the producer and consumer logic.
    -   Update `handleStart` and `handleStop` to correctly initialize, manage, and clear the `turnQueue`.
-   **`components/ChatBox.tsx`**:
    -   Add a `nowPlaying` prop to receive the sender of the currently speaking debater.
    -   Pass this prop down to `MessageBubble` to apply a visual highlight, improving user feedback.
