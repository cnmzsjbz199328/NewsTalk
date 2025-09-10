
# TTS 语音生成失败分析文档

## 1. 核心问题定位

您遇到的语音生成失败问题，其根本原因非常明确：**客户端（您的应用）向 `Kokoro-TTS` Gradio 服务传递了它无法识别的 `voice` 参数。**

错误日志清晰地指出了这一点：
```json
{
  "message": "Value: en-US-Standard-D is not in the list of choices: ['af_heart', 'af_bella', ...]",
}
```
这意味着，`Kokoro-TTS` 模型期望的 `voice` 参数是 `'af_heart'`, `'bm_george'` 这样的内部标识符，但我们的应用却发送了 `'en-US-Standard-D'` 这种类似 Google Text-to-Speech API 的格式。

问题代码位于 `constants.ts` 文件中：

```typescript
// file: constants.ts

export const SENDER_DETAILS: Record<Sender, { name: string; voice: string; ... }> = {
  // ...
  [Sender.Tom]: {
    name: 'Tom (The Optimist)',
    voice: 'en-US-Standard-D', // <--- 错误的值
    //...
  },
  [Sender.Mark]: {
    name: 'Mark (The Skeptic)',
    voice: 'en-US-Wavenet-B', // <--- 错误的值
    //...
  },
  [Sender.Sam]: {
    name: 'Sam (The Pragmatist)',
    voice: 'en-US-News-K', // <--- 错误的值
    //...
  },
};
```
这里的 `voice` 值与 `Kokoro-TTS` 模型的要求完全不匹配。

## 2. 问题与 "替换 Gemini" 的关联性分析

> 请审查文件，分析和之前文本生成使用gemini的时候有什么不同，是这个不同导致的语音生成失效吗？

您的这个问题非常好，它触及了问题的关键。答案是：**替换 Gemini 的行为本身并没有直接导致语音服务失效，但与该次重构相关的“数据配置”是失败的根源。**

可以这样理解：

*   **服务是解耦的**：您的应用架构中，**文本生成服务** (`aiDebateService.ts`) 和 **语音生成服务** (`ttsService.ts`) 是两个完全独立的模块。将文本生成从 Gemini 切换到三个 Gradio 模型，并不会在代码逻辑上影响 `ttsService.ts` 的运行方式。`ttsService` 根本不知道文本是哪里来的，它只负责接收文本并转换为语音。

*   **配置是错误的**：问题出在为角色（Tom, Mark, Sam）进行**配置**的 `constants.ts` 文件上。在重构或创建这个文件时，为 `voice` 属性填入了不正确的值。这些值可能是从一个基于 Google 语音服务的旧项目模板中遗留下来的，或者是开发者基于通用语音服务格式的假设而填写的。

**结论**：本次的语音功能失效，不是因为文本生成模型的*逻辑*变了，而是因为我们为辩手设定的*数据*（声音名称）与所选用的语音模型 (`Kokoro-TTS`) 的要求不匹配。这是一个**数据配置错误**，而不是一个**系统集成错误**。
