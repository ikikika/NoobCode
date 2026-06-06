import type { ProblemInput } from '../../schema'

const problem = {
  slug: 'best-time-to-buy-and-sell-stock',
  title: 'Best Time to Buy and Sell Stock',
  difficulty: 'easy',
  tags: ['array', 'greedy'],
  patterns: ['greedy', 'brute-force'],
  description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given
stock on day \`i\`.

Maximize your profit by choosing a single day to buy one stock and a different
day in the future to sell it. Return the maximum profit you can achieve. If no
profit is possible, return \`0\`.`,
  constraints: ['1 <= prices.length <= 10^5', '0 <= prices[i] <= 10^4'],
  examples: [
    {
      input: 'prices = [7,1,5,3,6,4]',
      output: '5',
      explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 5.',
    },
    {
      input: 'prices = [7,6,4,3,1]',
      output: '0',
      explanation: 'Prices only fall, so no profit is possible.',
    },
  ],
  functionName: { python: 'max_profit', javascript: 'maxProfit' },
  starterCode: {
    python: `def max_profit(prices):
    # Return the maximum achievable profit (0 if none).
    pass
`,
    javascript: `function maxProfit(prices) {
  // Return the maximum achievable profit (0 if none).
}
`,
  },
  tests: [
    { name: 'profit', args: [[7, 1, 5, 3, 6, 4]], expected: 5 },
    { name: 'no profit', args: [[7, 6, 4, 3, 1]], expected: 0 },
    { name: 'single day', args: [[5]], expected: 0 },
    { name: 'rising', args: [[1, 2, 3, 4, 5]], expected: 4, hidden: true },
    { name: 'late spike', args: [[3, 2, 6, 1, 4]], expected: 4, hidden: true },
  ],
  solutions: [
    {
      approachName: 'Brute Force',
      summary: 'Try every buy/sell pair and keep the best difference.',
      timeComplexity: 'O(n²)',
      spaceComplexity: 'O(1)',
      technique: {
        primaryPattern: 'brute-force',
        optimal: false,
        signature: {
          maxLoopDepth: 2,
          usesHashStructure: false,
          usesSorting: false,
          usesRecursion: false,
          twoPointer: false,
        },
      },
      steps: [
        {
          title: 'Compare every later day',
          explanation:
            'For each buy day, look at every later sell day and track the largest profit found.',
          code: {
            python: `def max_profit(prices):
    best = 0
    for i in range(len(prices)):
        for j in range(i + 1, len(prices)):
            best = max(best, prices[j] - prices[i])
    return best
`,
            javascript: `function maxProfit(prices) {
  let best = 0;
  for (let i = 0; i < prices.length; i++) {
    for (let j = i + 1; j < prices.length; j++) {
      best = Math.max(best, prices[j] - prices[i]);
    }
  }
  return best;
}
`,
          },
        },
      ],
    },
    {
      approachName: 'One Pass (Greedy)',
      summary: 'Track the cheapest price so far and the best profit against it.',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      technique: {
        primaryPattern: 'greedy',
        optimal: true,
        signature: {
          maxLoopDepth: 1,
          usesHashStructure: false,
          usesSorting: false,
          usesRecursion: false,
          twoPointer: false,
        },
      },
      steps: [
        {
          title: 'Remember the cheapest buy',
          explanation:
            'Sweep once, tracking the lowest price seen so far — the best day to have bought up to now.',
          code: {
            python: `def max_profit(prices):
    cheapest = prices[0]
    for price in prices:
        cheapest = min(cheapest, price)
    return 0
`,
            javascript: `function maxProfit(prices) {
  let cheapest = prices[0];
  for (const price of prices) {
    cheapest = Math.min(cheapest, price);
  }
  return 0;
}
`,
          },
        },
        {
          title: 'Take the best profit against it',
          explanation:
            'At each day, the best sale is today’s price minus the cheapest price seen so far. Keep the maximum of those differences.',
          code: {
            python: `def max_profit(prices):
    cheapest = prices[0]
    best = 0
    for price in prices:
        cheapest = min(cheapest, price)
        best = max(best, price - cheapest)
    return best
`,
            javascript: `function maxProfit(prices) {
  let cheapest = prices[0];
  let best = 0;
  for (const price of prices) {
    cheapest = Math.min(cheapest, price);
    best = Math.max(best, price - cheapest);
  }
  return best;
}
`,
          },
        },
      ],
    },
  ],
} satisfies ProblemInput

export default problem
