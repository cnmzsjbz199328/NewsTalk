
# TTS 语音生成修复方案

## 1. 目标

更新应用中的语音配置，使其与 `Tom1986/Kokoro-TTS` Gradio 服务所支持的语音列表完全匹配，从而解决语音生成失败的问题。

## 2. 修改范围

-   **文件**: `constants.ts`
-   **定位**: `SENDER_DETAILS` 常量对象。

## 3. 实施步骤

我们将把 `SENDER_DETAILS` 对象中 `Tom`, `Mark`, `Sam` 三位辩手的 `voice` 属性值，从当前无效的 Google 格式 (`en-US-Standard-D` 等)，修改为从错误日志提供的有效列表中选择的值。

为了让三位辩手的声音具有区分度，我们选择以下三个声音：

1.  **Tom (The Optimist)**: 将使用一个听起来清晰、标准的男声。
    *   **旧值**: `'en-US-Standard-D'`
    *   **新值**: `'bm_daniel'`

2.  **Mark (The Skeptic)**: 将使用另一个不同的男声，以体现其角色。
    *   **旧值**: `'en-US-Wavenet-B'`
    *   **新值**: `'bm_george'`

3.  **Sam (The Pragmatist)**: 将使用第三个男声，以保持声音多样性。
    *   **旧值**: `'en-US-News-K'`
    *   **新值**: `'am_eric'`

修改后的 `constants.ts` 文件将确保 `playSpeech` 函数调用 `ttsService` 时，传递的是 `Kokoro-TTS` 模型可以正确处理的 `voice` 标识符。

## 4. 预期结果

-   应用不再报出 "Value ... is not in the list of choices" 的错误。
-   文本转语音功能恢复正常，用户可以听到由 `Kokoro-TTS` 模型生成的三位辩手的发言。
