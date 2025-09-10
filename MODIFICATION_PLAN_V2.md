# Modification Plan: Automatic News Cycling & Prompt Optimization

## 1. Objective

This plan details the necessary modifications to implement two key user-requested features:

1.  **Automatic News Cycling:** After a debate on one news item concludes, the application should automatically select the *next* news item in the list and start a new debate on that topic.
2.  **AI Prompt Optimization:** The prompts sent to the AI models will be refined to eliminate undesirable conversational filler (e.g., "Okay, here’s my response:") and enforce a more direct, in-character response style.

---

## 2. Feature Implementation Details

### 2.1. Feature 1: Automatic News Cycling

**Goal:** Create a continuous "news cycle" mode where the debate seamlessly transitions from one headline to the next without user intervention.

**Technical Steps (`App.tsx`):**

1.  **State Management for Mode Control:**
    *   A new state variable, `isNewsCycleMode: boolean`, will be introduced and initialized to `false`.
    *   This state will be set to `true` only when the user initiates a debate by clicking the "Start News Cycle" button (i.e., when a news item is selected). It will remain `false` for debates started from custom user input. This ensures the cycling behavior is correctly scoped.

2.  **Refactor Debate Initialization Logic:**
    *   The core logic for initiating a debate (clearing the message history, resetting the turn queue and counter, adding the topic system message, and setting `isRunning` to `true`) will be extracted from the `handleStart` function into a new, reusable function called `startDebate(topic: string)`.
    *   The main `handleStart` function will now simply determine the topic and then call `startDebate(topic)`.

3.  **Enhance the Consumer `useEffect` Hook:**
    *   The end-of-debate condition (`if (turnCounterRef.current >= maxTurns)`) will be significantly upgraded.
    *   Inside this block, it will first check if `isNewsCycleMode` is `true`.
    *   If it is, the app will:
        *   Post a system message announcing the conclusion of the current topic.
        *   Calculate the `nextNewsIndex = selectedNewsIndex + 1`.
        *   **If a next news item exists** (`nextNewsIndex < newsItems.length`):
            *   Update the `selectedNewsIndex` state to the new index.
            *   Construct the topic string for the next news item.
            *   Call the `startDebate()` function with the new topic to kick off the next round seamlessly.
        *   **If no more news items exist**:
            *   Post a final system message (e.g., "News cycle complete.").
            *   Call `handleStop(false)` to terminate the entire process gracefully.
    *   If `isNewsCycleMode` is `false`, it will behave as before, simply concluding the single debate.

### 2.2. Feature 2: AI Prompt Optimization

**Goal:** Improve the quality and consistency of AI responses by providing more precise instructions and explicit constraints.

**Technical Steps (`services/aiDebateService.ts`):**

1.  **Rewrite Prompt Templates in `createPromptForModel`:**
    *   The existing prompt strings will be replaced with new versions that are more directive and include "negative constraints" (i.e., telling the model what *not* to do).

2.  **New Prompt Formulations:**
    *   **For Tom (Optimist):** The new prompt will explicitly instruct: `"Directly state your insightful, optimistic argument... Do not include any preamble (e.g., 'Okay, here's my response:'). Your response must end with a challenging question..."`
    *   **For Mark (Skeptic):** The new prompt will command: `"Directly state your concise, skeptical counter-argument... Do not use introductory phrases. Your response must end with a challenging question."`
    *   **For Sam (Pragmatist):** The new prompt will guide: `"Directly state your balanced, pragmatic rebuttal... Avoid conversational filler. Your response must end with a clarifying question."`

---

## 3. Expected Outcome

The application will gain a powerful "news cycle" feature, allowing for extended, autonomous operation. Simultaneously, the quality of the debate will be significantly enhanced, with AI responses becoming more direct, professional, and consistently in character, leading to a more engaging and believable user experience.