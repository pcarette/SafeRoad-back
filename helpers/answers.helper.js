function transformPropositions(arr) {
    return arr.map(item => {
      // Extract the digit(s) from the string and convert to a number
      return parseInt(item.replace(/\D/g, ''), 10) - 1;
    });
  }

  function compareAnswers(arr1, arr2) {
    // Convert both arrays to Sets
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
  
    // If the sets have different sizes, they are not equal
    if (set1.size !== set2.size) {
      return false;
    }
  
    // Check if every element in set1 is also in set2
    for (let element of set1) {
      if (!set2.has(element)) {
        return false;
      }
    }
  
    return true;
  }

module.exports = {transformPropositions, compareAnswers}
