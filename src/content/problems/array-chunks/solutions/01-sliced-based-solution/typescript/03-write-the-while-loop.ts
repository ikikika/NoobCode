function chunk(array: number[], size: number): number[][] {
  // create a new array to store the chunks called 'chunked'
  const chunked: number[][] = [];

  // create a variable to store the current index called 'index'
  let index = 0;

  // while index is less than array length
  while (index < array.length) {

    // push a slice of length 'size' from 'array' into 'chunked'

    // increment index by 'size'

  }

  return chunked;
}

// for loop when you know the exact number of times to run the code, 
// while loop when the number of iterations is unknown and depends on a dynamic condition

// slice(start_index, end_index) 
// end_index is not included in output
// const array = ["a", "b", "c", "d", "e"]
// array.slice(0, 2) = ["a", "b"]
// array.slice(2, 4) = ["c", "d"]