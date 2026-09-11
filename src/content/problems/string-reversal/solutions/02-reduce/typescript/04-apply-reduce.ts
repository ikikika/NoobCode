function reverseString(string: string): string {
  // split string
  // apply reduce function
  return string.split('').reduce((reversed, char) => char + reversed, '');
}

// reduce takes all different values within an array and condense them into a single value
// reduce( () => {}, initialValue)
// take initialValue and pass into the arrow function
// whatever value returned will be used as starting value for every successive run of the arrow function