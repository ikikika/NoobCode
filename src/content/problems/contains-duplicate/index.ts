import type { ProblemInput } from '../../schema'

const problem = {
  slug: 'contains-duplicate',
  title: 'Contains Duplicate',
  difficulty: 'easy',
  tags: ['array', 'hash-set', 'sorting'],
  patterns: ['hash-set', 'sorting'],
  description: `Given an integer array \`nums\`, return \`true\` if any value appears **at
least twice** in the array, and return \`false\` if every element is distinct.`,
  constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
  examples: [
    { input: 'nums = [1,2,3,1]', output: 'true', explanation: 'The value 1 appears twice.' },
    { input: 'nums = [1,2,3,4]', output: 'false' },
    { input: 'nums = [1,1,1,3,3,4,3,2,4,2]', output: 'true' },
  ],
  functionName: { python: 'contains_duplicate', javascript: 'containsDuplicate' },
  starterCode: {
    python: `def contains_duplicate(nums):
    # Return True if any value appears at least twice.
    pass
`,
    javascript: `function containsDuplicate(nums) {
  // Return true if any value appears at least twice.
}
`,
  },
  tests: [
    { name: 'has duplicate', args: [[1, 2, 3, 1]], expected: true },
    { name: 'all distinct', args: [[1, 2, 3, 4]], expected: false },
    { name: 'many duplicates', args: [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], expected: true },
    { name: 'single element', args: [[7]], expected: false, hidden: true },
    { name: 'negatives distinct', args: [[-1, -2, -3]], expected: false, hidden: true },
  ],
  solutions: [
    {
      approachName: 'Hash Set',
      summary: 'Track seen values; a repeat means a duplicate exists.',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      technique: {
        primaryPattern: 'hash-set',
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
          title: 'Build a set of seen values',
          explanation: 'Keep a hash set of every value we have already encountered.',
          code: {
            python: `def contains_duplicate(nums):
    seen = set()
    for n in nums:
        seen.add(n)
    return False
`,
            javascript: `function containsDuplicate(nums) {
  const seen = new Set();
  for (const n of nums) {
    seen.add(n);
  }
  return false;
}
`,
          },
        },
        {
          title: 'Return early on a repeat',
          explanation:
            'Before adding a value, check whether it is already in the set. If it is, we found a duplicate and can return immediately.',
          code: {
            python: `def contains_duplicate(nums):
    seen = set()
    for n in nums:
        if n in seen:
            return True
        seen.add(n)
    return False
`,
            javascript: `function containsDuplicate(nums) {
  const seen = new Set();
  for (const n of nums) {
    if (seen.has(n)) {
      return true;
    }
    seen.add(n);
  }
  return false;
}
`,
          },
        },
      ],
    },
    {
      approachName: 'Sort and Scan',
      summary: 'Sort the array; duplicates become adjacent neighbours.',
      timeComplexity: 'O(n log n)',
      spaceComplexity: 'O(1)',
      technique: {
        primaryPattern: 'sorting',
        optimal: false,
        signature: {
          maxLoopDepth: 1,
          usesHashStructure: false,
          usesSorting: true,
          usesRecursion: false,
          twoPointer: false,
        },
      },
      steps: [
        {
          title: 'Sort the array',
          explanation:
            'After sorting, any duplicate values sit next to each other, so a single linear scan can find them.',
          code: {
            python: `def contains_duplicate(nums):
    nums = sorted(nums)
    return False
`,
            javascript: `function containsDuplicate(nums) {
  nums = [...nums].sort((a, b) => a - b);
  return false;
}
`,
          },
        },
        {
          title: 'Compare adjacent neighbours',
          explanation:
            'Walk the sorted array and compare each element with the previous one. Equal neighbours mean a duplicate.',
          code: {
            python: `def contains_duplicate(nums):
    nums = sorted(nums)
    for i in range(1, len(nums)):
        if nums[i] == nums[i - 1]:
            return True
    return False
`,
            javascript: `function containsDuplicate(nums) {
  nums = [...nums].sort((a, b) => a - b);
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] === nums[i - 1]) {
      return true;
    }
  }
  return false;
}
`,
          },
        },
      ],
    },
  ],
} satisfies ProblemInput

export default problem
