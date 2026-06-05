import type { LanguageId } from '../../content/schema'
import type { MethodReview } from '../analysis/types'
import type { AiModelId } from '../../store/useSettingsStore'

const coachPrompt = `You are a concise programming coach for a LeetCode-style trainer.
A deterministic analysis engine has already judged the user's solution. Do NOT
contradict its verdict, complexity estimate, or list of issues. Your only job is
to rewrite those facts as 2-4 short, encouraging sentences of plain-English
coaching. No code blocks. No headings. Keep it under 90 words.`

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>
}

export async function enhanceReview(
  review: MethodReview,
  context: { problemTitle: string; language: LanguageId; userCode: string; passed: boolean },
  settings: { apiKey: string; model: AiModelId },
  signal?: AbortSignal,
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
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal,
      headers: {
        'anthropic-dangerous-direct-browser-access': 'true',
        'x-api-key': settings.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: settings.model,
        max_tokens: 1024,
        system: coachPrompt,
        messages: [{ role: 'user', content: userContent }],
      }),
    })

    if (!res.ok) return review

    const data = (await res.json()) as AnthropicResponse
    const text = data.content
      ?.filter((b) => b.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text)
      .join('')
      .trim()

    if (!text) return review

    return { ...review, prose: text, source: 'ai' }
  } catch {
    return review
  }
}
