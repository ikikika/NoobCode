import type { ProblemInput } from '../../schema'

const problem = {
  slug: 'valid-parentheses',
  title: 'Valid Parentheses',
  difficulty: 'easy',
  tags: ['string', 'stack'],
  patterns: ['stack'],
  description: `Given a string \`s\` containing just the characters \`(\`, \`)\`, \`{\`, \`}\`,
\`[\` and \`]\`, determine if the input string is **valid**.

An input string is valid if:

1. Open brackets are closed by the same type of bracket.
2. Open brackets are closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
  constraints: ['1 <= s.length <= 10^4', 's consists of parentheses only "()[]{}".'],
  examples: [
    { input: 's = "()"', output: 'true' },
    { input: 's = "()[]{}"', output: 'true' },
    { input: 's = "(]"', output: 'false' },
    {
      input: 's = "([)]"',
      output: 'false',
      explanation: 'The brackets are not closed in the correct order.',
    },
  ],
  functionName: { python: 'is_valid', javascript: 'isValid' },
  starterCode: {
    python: `def is_valid(s):
    # Return True if every bracket is matched and correctly ordered.
    pass
`,
    javascript: `function isValid(s) {
  // Return true if every bracket is matched and correctly ordered.
}
`,
  },
  tests: [
    { name: 'simple pair', args: ['()'], expected: true },
    { name: 'all types', args: ['()[]{}'], expected: true },
    { name: 'mismatch', args: ['(]'], expected: false },
    { name: 'wrong order', args: ['([)]'], expected: false },
    { name: 'nested', args: ['([{}])'], expected: true, hidden: true },
    { name: 'unclosed', args: ['('], expected: false, hidden: true },
    { name: 'extra close', args: ['){'], expected: false, hidden: true },
  ],
  solutions: [
    {
      approachName: 'Stack',
      summary: 'Push opening brackets; pop and match when a closing bracket appears.',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      technique: {
        primaryPattern: 'stack',
        optimal: true,
        signature: {
          maxLoopDepth: 1,
          usesHashStructure: true,
          usesSorting: false,
          usesRecursion: false,
          twoPointer: false,
        },
      },
      steps: [
        {
          title: 'Map closers to openers',
          explanation:
            'Set up a lookup from each closing bracket to its matching opening bracket, and an empty stack to track unmatched openers.',
          code: {
            python: `def is_valid(s):
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    return len(stack) == 0
`,
            javascript: `function isValid(s) {
  const pairs = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  return stack.length === 0;
}
`,
          },
        },
        {
          title: 'Push openers, match closers',
          explanation:
            'Iterate the string. Opening brackets are pushed. For a closing bracket, the top of the stack must be its matching opener — otherwise the string is invalid.',
          code: {
            python: `def is_valid(s):
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    for ch in s:
        if ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
        else:
            stack.append(ch)
    return len(stack) == 0
`,
            javascript: `function isValid(s) {
  const pairs = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  for (const ch of s) {
    if (ch in pairs) {
      if (stack.pop() !== pairs[ch]) {
        return false;
      }
    } else {
      stack.push(ch);
    }
  }
  return stack.length === 0;
}
`,
          },
        },
      ],
    },
  ],
} satisfies ProblemInput

export default problem
