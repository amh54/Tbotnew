function calculateNavIndices(currentIndex, listLength) {
  if (listLength <= 1) {
    return {
      prevIndex: 0,
      nextIndex: 0,
    };
  }

  const prevIndex = currentIndex <= 0 ? listLength - 1 : currentIndex - 1;

  const nextIndex = currentIndex >= listLength - 1 ? 0 : currentIndex + 1;

  return {
    prevIndex,
    nextIndex,
  };
}

module.exports = calculateNavIndices;
