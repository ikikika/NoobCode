function maxArea(height: number[]): number {
  // start pointers at both ends
  let left = 0;
  let right = height.length - 1;
  
  // create a variable to store the best area called 'best'
  let best = 0;

  // use a while loop to move the pointers inward

    // calculate the current area of the container

    // update the best area if the current area is greater

    // move the shorter pointer inward

  return best;
}

// understand the problem
// eg height = [1,8,6,2,5,4,8,3,7]

// 8    x         x
// 7    x x       x   x
// 6    x x       x   x
// 5    x x   x   x   x
// 4    x x   x x x   x
// 3    x x   x x x x x
// 2    x x x x x x x x
// 1  x x x x x x x x x
//    0 1 2 3 4 5 6 7 8

// we need to find the two lines that form the container with the most water
// the container is formed by the two lines and the x-axis
// the area of the container is the width of the container times the height of the container
// the width of the container is the distance between the two lines
// the height of the container is the minimum of the two lines

// in this example, we start from both ends, height[0] and height[8], area formed is 8
// notice that moving the longer line inward will not increase the area, 
// so we move the shorter line inward, we get height[1] and height[8], area formed is 49

// we move the shorter line inward again, we get height[1] and height[7], area formed is 18

// we move the shorter line inward again, we get height[1] and height[6], area formed is 40

// we continue this process until the two pointers meet

// this approach is better because we do not need to check all pairs of lines
// we only need to check the pairs that are formed by the shorter line
// this reduces the time complexity from O(n^2) to O(n)