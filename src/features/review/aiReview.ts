import type { LanguageId } from '../../content/schema'
import type { MethodReview } from '../analysis/types'
import type { AiModelId } from '../../store/useSettingsStore'

const coachPrompt = `You are a concise programming coach for a LeetCode-style trainer.
A deterministic analysis engine has already judged the user's solution. Do NOT
contradict its verdict, complexity estimate, or list of issues. Your only job is
to rewrite those facts as 2-4 short, encouraging sentences of plain-English
coaching. No code blocks. No headings. Keep it under 90 words.`

const explainPrompt = `You are a concise programming tutor. Explain the given code step in
plain English: what it does and why it matters for solving the problem. 2-3
short sentences, no code blocks, no headings.`

// USD per 1M tokens. Source: Claude API pricing.
const PRICING: Record<AiModelId, { input: number; output: number }> = {
  'claude-haiku-4-5': { input: 1, output: 5 },
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-opus-4-8': { input: 5, output: 25 },
}

function costFor(model: AiModelId, inputTokens: number, outputTokens: number): number {
  const p = PRICING[model] ?? { input: 0, output: 0 }
  return (inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output
}

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

function headers(apiKey: string): HeadersInit {
  return {
    'anthropic-dangerous-direct-browser-access': 'true',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  }
}

interface EnhanceOptions {
  signal?: AbortSignal
  // When provided, the request streams and onDelta receives the accumulated
  // prose as it arrives.
  onDelta?: (proseSoFar: string) => void
}

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>
  usage?: { input_tokens?: number; output_tokens?: number }
}

export async function enhanceReview(
  review: MethodReview,
  context: { problemTitle: string; language: LanguageId; userCode: string; passed: boolean },
  settings: { apiKey: string; model: AiModelId },
  options: EnhanceOptions = {},
): Promise<MethodReview> {
  if (!settings.apiKey) return review

  const heuristicFacts = [
    `Problem: ${context.problemTitle}`,
    `Language: ${context.language}`,
    `Tests passed: ${context.passed ? 'yes' : 'no'}`,
    `Detected approach: ${review.approachUsed}`,
    `Estimated time complexity: ${review.estimatedComplexity.time}`,
    `Estimated space complexity: ${review.estimatedComplexity.space}`,
    `Optimal: ${review.isOptimal ? 'yes' : 'no'}`,
    review.inefficiencies.length ? `Inefficiencies: ${review.inefficiencies.join('; ')}` : '',
    review.suggestions.length ? `Suggestions: ${review.suggestions.join('; ')}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const userContent = `${heuristicFacts}\n\nUser code:\n\`\`\`${context.language}\n${context.userCode}\n\`\`\``

  try {
    if (options.onDelta) {
      const streamed = await streamMessage(
        {
          apiKey: settings.apiKey,
          model: settings.model,
          system: coachPrompt,
          userContent,
          signal: options.signal,
        },
        options.onDelta,
      )
      if (!streamed.text) return review
      return {
        ...review,
        prose: streamed.text,
        source: 'ai',
        usage: {
          inputTokens: streamed.inputTokens,
          outputTokens: streamed.outputTokens,
          costUsd: costFor(settings.model, streamed.inputTokens, streamed.outputTokens),
        },
      }
    }

    // Non-streaming path (also the path exercised by unit tests).
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      signal: options.signal,
      headers: headers(settings.apiKey),
      body: JSON.stringify({
        model: settings.model,
        max_tokens: 1024,
        system: coachPrompt,
        messages: [{ role: 'user', content: userContent }],
      }),
    })

    if (!res.ok) return review

    const data = (await res.json()) as AnthropicResponse
    const text = extractText(data)
    if (!text) return review

    const inputTokens = data.usage?.input_tokens ?? 0
    const outputTokens = data.usage?.output_tokens ?? 0
    return {
      ...review,
      prose: text,
      source: 'ai',
      usage: {
        inputTokens,
        outputTokens,
        costUsd: costFor(settings.model, inputTokens, outputTokens),
      },
    }
  } catch {
    return review
  }
}

// "Explain this step" — coaching text for a single solution step.
export async function explainStep(
  context: { problemTitle: string; language: LanguageId; code: string; stepTitle?: string },
  settings: { apiKey: string; model: AiModelId },
  signal?: AbortSignal,
): Promise<string | null> {
  if (!settings.apiKey) return null
  const userContent = `Problem: ${context.problemTitle}\nStep: ${context.stepTitle ?? 'current step'}\n\n\`\`\`${context.language}\n${context.code}\n\`\`\``
  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      signal,
      headers: headers(settings.apiKey),
      body: JSON.stringify({
        model: settings.model,
        max_tokens: 512,
        system: explainPrompt,
        messages: [{ role: 'user', content: userContent }],
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as AnthropicResponse
    return extractText(data) || null
  } catch {
    return null
  }
}

function extractText(data: AnthropicResponse): string {
  return (
    data.content
      ?.filter((b) => b.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text)
      .join('')
      .trim() ?? ''
  )
}

interface StreamArgs {
  apiKey: string
  model: AiModelId
  system: string
  userContent: string
  signal?: AbortSignal
}

interface StreamResult {
  text: string
  inputTokens: number
  outputTokens: number
}

// Parse the Anthropic SSE stream: message_start carries input_tokens,
// content_block_delta carries text, message_delta carries cumulative
// output_tokens.
async function streamMessage(
  args: StreamArgs,
  onDelta: (text: string) => void,
): Promise<StreamResult> {
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    signal: args.signal,
    headers: headers(args.apiKey),
    body: JSON.stringify({
      model: args.model,
      max_tokens: 1024,
      stream: true,
      system: args.system,
      messages: [{ role: 'user', content: args.userContent }],
    }),
  })

  if (!res.ok || !res.body) return { text: '', inputTokens: 0, outputTokens: 0 }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let text = ''
  let inputTokens = 0
  let outputTokens = 0

  const handle = (json: string) => {
    let evt: {
      type?: string
      delta?: { type?: string; text?: string }
      message?: { usage?: { input_tokens?: number } }
      usage?: { output_tokens?: number }
    }
    try {
      evt = JSON.parse(json)
    } catch {
      return
    }
    if (evt.type === 'message_start') {
      inputTokens = evt.message?.usage?.input_tokens ?? inputTokens
    } else if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
      text += evt.delta.text ?? ''
      onDelta(text)
    } else if (evt.type === 'message_delta') {
      outputTokens = evt.usage?.output_tokens ?? outputTokens
    }
  }

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('data:')) handle(trimmed.slice(5).trim())
    }
  }

  return { text: text.trim(), inputTokens, outputTokens }
}
