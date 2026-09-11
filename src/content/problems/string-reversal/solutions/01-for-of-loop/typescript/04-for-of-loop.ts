function reverseString(string: string): string {
  // define end state
  let reversedString = '';

  // use for of loop to break string and iterate over the string
  for (const char of string) {
    // prepend each character to the end state
    
  }
  return reversedString;
}

// avoid classic for loop because it is easy to make mistakes
// for( var i = 0; i < string.length; i++) 
// A classic indexed loop can go wrong more easily: off-by-one (i <= length), wrong direction when reversing, or var leaking the index. 
// for...of skips indexing, so those mistakes don’t come up.