import type { ProblemInput } from '../../schema'

const problem = {
  slug: 'maximum-subarray',
  title: 'Maximum Subarray',
  difficulty: 'medium',
  tags: ['array', 'dynamic-programming'],
  patterns: ['dynamic-programming', 'brute-force'],
  description: `Given an integer array \`nums\`, find the contiguous subarray (containing at
least one number) which has the largest sum, and return its sum.`,
  constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
  examples: [
    {
      input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
      output: '6',
      explanation: 'The subarray [4,-1,2,1] has the largest sum 6.',
    },
    { input: 'nums = [1]', output: '1' },
    { input: 'nums = [5,4,-1,7,8]', output: '23' },
  ],
  functionName: { python: 'max_sub_array', javascript: 'maxSubArray' },
  starterCode: {
    python: `def max_sub_array(nums):
    # Return the largest sum of any contiguous subarray.
    pass
`,
    javascript: `function maxSubArray(nums) {
  // Return the largest sum of any contiguous subarray.
}
`,
  },
  tests: [
    { name: 'mixed', args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
    { name: 'single', args: [[1]], expected: 1 },
    { name: 'all positive', args: [[5, 4, -1, 7, 8]], expected: 23 },
    { name: 'all negative', args: [[-3, -1, -2]], expected: -1, hidden: true },
    { name: 'one negative', args: [[-1]], expected: -1, hidden: true },
  ],
  solutions: [
    {
      approachName: 'Brute Force',
      summary: 'Try every start/end pair and sum each window.',
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
          title: 'Sum every subarray',
          explanation:
            'For each start index, extend to the right while tracking the running sum, and keep the best sum seen.',
          code: {
            python: `def max_sub_array(nums):
    best = nums[0]
    for i in range(len(nums)):
        total = 0
        for j in range(i, len(nums)):
            total += nums[j]
            best = max(best, total)
    return best
`,
            javascript: `function maxSubArray(nums) {
  let best = nums[0];
  for (let i = 0; i < nums.length; i++) {
    let total = 0;
    for (let j = i; j < nums.length; j++) {
      total += nums[j];
      best = Math.max(best, total);
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
      approachName: "Kadane's Algorithm",
      summary: 'Track the best subarray ending at each index in one pass.',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      technique: {
        primaryPattern: 'dynamic-programming',
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
          title: 'Track the best run ending here',
          explanation:
            'Keep `current`, the best sum of a subarray ending at the current index. Either extend the previous run or start fresh at the current number — whichever is larger.',
          code: {
            python: `def max_sub_array(nums):
    current = nums[0]
    for n in nums[1:]:
        current = max(n, current + n)
    return current
`,
            javascript: `function maxSubArray(nums) {
  let current = nums[0];
  for (let i = 1; i < nums.length; i++) {
    current = Math.max(nums[i], current + nums[i]);
  }
  return current;
}
`,
          },
        },
        {
          title: 'Track the global best too',
          explanation:
            'Maintain a separate `best` that records the largest `current` ever seen, so a strong early run is not lost when later numbers drag the running sum down.',
          code: {
            python: `def max_sub_array(nums):
    current = nums[0]
    best = nums[0]
    for n in nums[1:]:
        current = max(n, current + n)
        best = max(best, current)
    return best
`,
            javascript: `function maxSubArray(nums) {
  let current = nums[0];
  let best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    current = Math.max(nums[i], current + nums[i]);
    best = Math.max(best, current);
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
