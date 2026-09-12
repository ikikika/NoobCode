function reverseString(string: string): string {
  // // Split string into an array of letters.
  // const letters = string.split('');

  // // Reverse the order of letters in the Array
  // const reversedArray = letters.reverse();

  // // Join reversed array back into a string (of letters).
  // const reversedString = reversedArray.join('');
  
  // return reversedString;

  // bonus: we can actually combine the steps into one line
  return string.split('').reverse().join('');
}