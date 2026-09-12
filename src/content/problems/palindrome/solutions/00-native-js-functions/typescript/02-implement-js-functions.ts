function palindrome(string: string): boolean {
  const reversed = string
    .split('')
    .reverse()
    .join('');

  return reversed === string;
}