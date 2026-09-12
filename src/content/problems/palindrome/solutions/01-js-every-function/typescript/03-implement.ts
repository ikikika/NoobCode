function palindrome(string: string): boolean {
  // split the string and apply every function
  return string.split('').every((char, i) => {
    return char === string[string.length - i - 1];
  });
}

// const array = [0, 10, 14]
// array.every(item => item > 0) // true
// if any inner function returns false,
// the every function will return false
// if all inner functions return true,
// the every function will return true
