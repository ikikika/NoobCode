function maxChar(string: string): string {
  // initialise a character map object
  const charMap: Record<string, number> = {};

  // initialise a max counter
  let maxCount = 0;

  // initialise a max character variable
  let maxChar = '';

  // loop through the string
  for (let char of string) {

    if (charMap[char]) {
      // if the character is not in the map, add it to the map with a value of 1
      charMap[char]++;

    } else {
      // if the character is in the map, increment the value
      charMap[char] = 1;

    }
  }
  // loop through the character map
  for (let char in charMap) {
    
    // if the value is greater than the max counter, update the max counter and the max character
  }
  
  // return the max character
  return maxChar;
}

// eg, charMap = { "a": 1, "b": 2, "c": 3 }
// charMap["c"] = 3