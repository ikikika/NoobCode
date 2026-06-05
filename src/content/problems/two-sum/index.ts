import type { ProblemInput } from '../../schema'

const problem = {
  slug: 'two-sum',
  title: 'Two Sum',
  difficulty: 'easy',
  tags: ['array', 'hash-map'],
  patterns: ['brute-force', 'hash-map'],
  description: `Given an array of integers \`nums\` and an integer \`target\`, return the
indices of the two numbers such that they add up to \`target\`.

You may assume that each input has **exactly one solution**, and you may not
use the same element twice. You can return the answer in any order.`,
  constraints: [
    '2 <= nums.length <= 10^4',
    '-10^9 <= nums[i] <= 10^9',
    '-10^9 <= target <= 10^9',
    'Only one valid answer exists.',
  ],
  examples: [
    {
      input: 'nums = [2,7,11,15], target = 9',
      output: '[0,1]',
      explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
    },
    {
      input: 'nums = [3,2,4], target = 6',
      output: '[1,2]',
    },
    {
      input: 'nums = [3,3], target = 6',
      output: '[0,1]',
    },
  ],
  functionName: { python: 'two_sum', javascript: 'twoSum' },
  starterCode: {
    python: `def two_sum(nums, target):
    # Return the indices of the two numbers that add up to target.
    pass
`,
    javascript: `function twoSum(nums, target) {
  // Return the indices of the two numbers that add up to target.
}
`,
  },
  tests: [
    { name: 'example 1', args: [[2, 7, 11, 15], 9], expected: [0, 1] },
    { name: 'example 2', args: [[3, 2, 4], 6], expected: [1, 2] },
    { name: 'duplicate values', args: [[3, 3], 6], expected: [0, 1] },
    { name: 'negatives', args: [[-1, -2, -3, -4, -5], -8], expected: [2, 4], hidden: true },
    { name: 'large gap', args: [[0, 4, 3, 0], 0], expected: [0, 3], hidden: true },
  ],
  solutions: [
    {
      approachName: 'Brute Force',
      summary: 'Check every pair of indices until a matching sum is found.',
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
          title: 'Iterate over the first index',
          explanation:
            'Loop over each index `i`. For each `i` we will look for a partner that completes the target sum.',
          code: {
            python: `def two_sum(nums, target):
    for i in range(len(nums)):
        # look for a partner for nums[i]
        pass
`,
            javascript: `function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    // look for a partner for nums[i]
  }
}
`,
          },
        },
        {
          title: 'Scan the rest for a match',
          explanation:
            'For each `i`, scan every later index `j`. If `nums[i] + nums[j] === target`, return the pair.',
          code: {
            python: `def two_sum(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []
`,
            javascript: `function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}
`,
          },
        },
      ],
    },
    {
      approachName: 'Hash Map (one pass)',
      summary: 'Remember each value as you go; look up the complement in O(1).',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      technique: {
        primaryPattern: 'hash-map',
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
          title: 'Track seen values',
          explanation:
            'Create a hash map from value to index. As we iterate we record each number we have seen so far.',
          code: {
            python: `def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        seen[n] = i
    return []
`,
            javascript: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    seen.set(nums[i], i);
  }
  return [];
}
`,
          },
        },
        {
          title: 'Look up the complement first',
          explanation:
            'Before storing the current number, check whether its complement (`target - n`) is already in the map. If so, we have our answer in a single pass.',
          code: {
            python: `def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        complement = target - n
        if complement in seen:
            return [seen[complement], i]
        seen[n] = i
    return []
`,
            javascript: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}
`,
          },
        },
      ],
    },
  ],
} satisfies ProblemInput

export default problem
