function calculateNavIndices(index, listLength) {
  if (index === 0) {
    return {
      prevIndex: 'list',
      nextIndex: listLength > 1 ? 1 : 'list'
    };
  } else if (index === listLength - 1) {
    return {
      prevIndex: index - 1,
      nextIndex: 'list'
    };
  } else {
    return {
      prevIndex: index - 1,
      nextIndex: index + 1
    };
  }
}

module.exports = calculateNavIndices;
