# Modification Plan: Custom Voices & Configurable Debate Rounds

## 1. Objective

This plan details the necessary modifications to implement two key user-requested features:

1.  **Custom Voice Selection:** Empower the user to assign a specific voice to each of the three AI debaters (Tom, Mark, Sam) via the Settings Panel.
2.  **Configurable Debate Rounds:** Allow the user to set a finite number of rounds for the debate, after which the debate automatically concludes.

This plan explicitly acknowledges the user's critical distinction between **Debate Rounds (Duration)** and the existing **Context Turns (Memory)** setting.

---

## 2. Feature Implementation Details

### 2.1. Custom Voice Selection

**Goal:** Replace the hard-coded voice assignments with a user-configurable UI.

**Technical Steps:**

1.  **Data Source (`constants.ts`):**
    *   A new constant, `KOKORO_TTS_VOICES`, will be created. This will be an array of objects, where each object contains an `id` (e.g., `'bm_daniel'`) and a user-friendly `name` (e.g., `'Daniel (Male UK)'`). This list will populate the UI dropdowns.
    *   The hard-coded `voice` property in `SENDER_DETAILS` will now serve as the **default** voice for each character.

2.  **State Management (`types.ts` & `App.tsx`):**
    *   The `Settings` interface in `types.ts` will be extended to include `tomVoice: string`, `markVoice: string`, and `samVoice: string`.
    *   The initial state for `settings` in `App.tsx` will be updated to include these new properties, initialized with the default values from `SENDER_DETAILS`.

3.  **UI Implementation (`components/SettingsPanel.tsx`):**
    *   Under the "Text-to-Speech" heading, three new dropdown (`<select>`) menus will be added: "Tom's Voice", "Mark's Voice", and "Sam's Voice".
    *   Each dropdown will be populated by mapping over the `KOKORO_TTS_VOICES` array.
    *   The `onChange` event for each dropdown will trigger `onSettingsChange` to update the corresponding state (`tomVoice`, `markVoice`, etc.).

4.  **Logic Integration (`App.tsx`):**
    *   The `debateLoop` function will be modified. When preparing to call `generateSpeech`, instead of using a hard-coded value, it will dynamically select the correct voice from the `settings` state based on the current speaker.

### 2.2. Configurable Debate Rounds

**Goal:** Implement a mechanism to end the debate automatically after a set number of rounds.

**Technical Steps:**

1.  **State Management (`types.ts` & `App.tsx`):**
    *   The `Settings` interface will be extended with a new property: `debateRounds: number`.
    *   The initial `settings` state in `App.tsx` will include this property, with a default value (e.g., `5` rounds).

2.  **UI Implementation (`components/SettingsPanel.tsx`):**
    *   Under the "Debate Parameters" heading, a new `Slider` component for "Debate Rounds" will be added. This allows the user to intuitively select the desired length of the debate (e.g., from 1 to 10 rounds).

3.  **Core Logic (`App.tsx`):**
    *   The `debateLoop` function will undergo a significant logic enhancement.
    *   A `turnCounter` will be introduced and initialized to `0` at the start of the loop.
    *   The maximum number of turns will be calculated: `maxTurns = settings.debateRounds * 3`.
    *   The main `while` loop condition will be updated to: `while (isRunningRef.current && turnCounter < maxTurns)`.
    *   The `turnCounter` will be incremented after each debater's turn.
    *   After the loop finishes, a check will determine if it ended due to reaching the round limit. If so, a system message ("Debate concluded after X rounds.") will be added, and the debate will be formally stopped by setting `isRunning` to `false`.

### 2.3. Prompting Logic Confirmation

The existing prompting logic in `services/aiDebateService.ts` correctly aligns with the user's description. It constructs a prompt based on the character's persona and the recent history (`history.slice(-contextTurns * 3)`), which naturally includes the statements of the preceding speakers. The initial news topic is injected as the first message, ensuring it forms the basis of the entire conversation. No changes are required in this service file.

---

## 3. Expected Outcome

Upon completion, the application will feature a more powerful and flexible settings panel. Users will be able to customize the auditory experience by selecting voices and control the length and flow of the debate, resulting in a much more engaging and tailored experience.