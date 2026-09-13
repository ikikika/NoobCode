function maxArea(height: number[]): number {
  // create a variable to store the best area called 'best'
  let best = 0;
  
  // first for loop to pick a left line

    // nested second for loop to pick a right line

      // calculate the area of the container

      // update the best area if the current area is greater

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

// in this example, lets consider the area formed by the longest lines: height[1], height[6] and height[8]
// area between height[1] and height[6] is 48
// area between height[1] and height[8] is 49
// area between height[6] and height[8] is 14
// so the maximum area is 49
// we can deduce that the longest lines do not always form the container with the most water
// we need to take into account the distance between the two lines as well

// we need to consider all the pairs that can be formed by the values in the array
// we can use a nested loop to iterate through all pairs of lines
