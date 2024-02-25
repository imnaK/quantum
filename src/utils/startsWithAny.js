String.prototype.startsWithAny = function(array) {
  for (let element of array) {
    if (this.startsWith(element)) {
      return element;
    }
  }
  return null;
};