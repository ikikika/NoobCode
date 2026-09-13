function chunk(array: number[], size: number): number[][] {
  // create a new array to store the chunks called 'chunked'

  // loop through unchunked array

    // retrieve the last element in 'chunked'

    // if last element does not exist or if last element exist and its length is equal to size (means it's full)
    
      // push a new chunk into 'chunked' with the current element

    // else, add current element into chunked
    
  return [];
}

// make sense of the problem
// const array = [1, 2, 3, 4], const size = 2
// create a new array to store the chunks called 'chunked', const chunked = []
// loop through unchunked array [1, 2, 3, 4]
  
  // 1st item = 1
  // retrieve the last element in 'chunked', at this point it's undefined
  // means it's empty, so we should start a new chunk
  // push a new chunk into 'chunked' with the current element, 
  // chunked = [[1]]

  // 2nd item = 2
  // retrieve the last element in 'chunked', at this point it's [1]
  // means its not empty
  // check if the length of the last element is equal to size
  // at this point, size of last element is 1
  // so we should add the current element into the last element
  // chunked = [[1, 2]]

  // 3rd item = 3
  // retrieve the last element in 'chunked', at this point it's [1, 2]
  // check if the length of the last element is equal to size
  // at this point, size of last element is 2, which is equal to size
  // so we should start a new chunk
  // push a new chunk into 'chunked' with the current element
  // chunked = [[1, 2], [3]]
  
  // 4th item = 4
  // retrieve the last element in 'chunked', at this point it's [3]
  // check if the length of the last element is equal to size
  // at this point, size of last element is 1
  // so we should add the current element into the last element
  // chunked = [[1, 2], [3, 4]]
  
  // no more items to loop through, so we return 'chunked'
  
  