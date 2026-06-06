import type { ProblemInput } from '../../schema'

const problem = {
  slug: 'binary-search',
  title: 'Binary Search',
  difficulty: 'easy',
  tags: ['array', 'binary-search'],
  patterns: ['binary-search', 'brute-force'],
  description: `Given a **sorted** (ascending) array of integers \`nums\` and an integer
\`target\`, return the index of \`target\` if it is in \`nums\`, otherwise return
\`-1\`.

You must write an algorithm with \`O(log n)\` runtime complexity.`,
  constraints: [
    '1 <= nums.length <= 10^4',
    '-10^4 < nums[i], target < 10^4',
    'All integers in nums are unique.',
    'nums is sorted in ascending order.',
  ],
  examples: [
    {
      input: 'nums = [-1,0,3,5,9,12], target = 9',
      output: '4',
      explanation: '9 exists in nums and its index is 4.',
    },
    {
      input: 'nums = [-1,0,3,5,9,12], target = 2',
      output: '-1',
      explanation: '2 does not exist in nums so return -1.',
    },
  ],
  functionName: { python: 'search', javascript: 'search' },
  starterCode: {
    python: `def search(nums, target):
    # Return the index of target, or -1 if it is not present.
    pass
`,
    javascript: `function search(nums, target) {
  // Return the index of target, or -1 if it is not present.
}
`,
  },
  tests: [
    { name: 'found middle', args: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 },
    { name: 'missing', args: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 },
    { name: 'single hit', args: [[5], 5], expected: 0 },
    { name: 'single miss', args: [[5], -5], expected: -1, hidden: true },
    { name: 'first element', args: [[2, 4, 6, 8], 2], expected: 0, hidden: true },
    { name: 'last element', args: [[2, 4, 6, 8], 8], expected: 3, hidden: true },
  ],
  solutions: [
    {
      approachName: 'Linear Scan',
      summary: 'Walk the array left to right. Simple, but ignores that it is sorted.',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      technique: {
        primaryPattern: 'brute-force',
        optimal: false,
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
          title: 'Check each element',
          explanation: 'Return the index as soon as an element equals the target; otherwise -1.',
          code: {
            python: `def search(nums, target):
    for i in range(len(nums)):
        if nums[i] == target:
            return i
    return -1
`,
            javascript: `function search(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === target) {
      return i;
    }
  }
  return -1;
}
`,
          },
        },
      ],
    },
    {
      approachName: 'Binary Search',
      summary: 'Halve the search range each step using two pointers.',
      timeComplexity: 'O(log n)',
      spaceComplexity: 'O(1)',
      technique: {
        primaryPattern: 'binary-search',
        optimal: true,
        signature: {
          maxLoopDepth: 1,
          usesHashStructure: false,
          usesSorting: false,
          usesRecursion: false,
          twoPointer: true,
        },
      },
      steps: [
        {
          title: 'Set the window bounds',
          explanation:
            'Use two pointers, `left = 0` and `right = len(nums) - 1`, that bracket the part of the array still worth searching.',
          code: {
            python: `def search(nums, target):
    left = 0
    right = len(nums) - 1
    return -1
`,
            javascript: `function search(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  return -1;
}
`,
          },
        },
        {
          title: 'Compare the midpoint and halve',
          explanation:
            'Look at the middle element. If it equals the target, return it. If it is too small, discard the left half; otherwise discard the right half. The range shrinks by half each iteration.',
          code: {
            python: `def search(nums, target):
    left = 0
    right = len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
`,
            javascript: `function search(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) {
      return mid;
    }
    if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return -1;
}
`,
          },
        },
      ],
    },
  ],
} satisfies ProblemInput

export default problem
