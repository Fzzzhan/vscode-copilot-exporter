// Example JavaScript file to test the Copilot Exporter extension
// This file contains code patterns that the extension will detect

function calculateFactorial(n) {
  if (n <= 1) return 1;
  return n * calculateFactorial(n - 1);
}

class DataProcessor {
  constructor(data) {
    this.data = data;
  }

  // Process and filter data
  processData() {
    return this.data
      .filter(item => item.isValid)
      .map(item => ({
        id: item.id,
        value: item.value * 2,
        processed: true
      }));
  }
}

const asyncFunction = async () => {
  try {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

// Export functions for use in other modules
module.exports = {
  calculateFactorial,
  DataProcessor,
  asyncFunction
};