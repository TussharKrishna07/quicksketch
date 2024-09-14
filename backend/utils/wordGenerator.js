const words = ['apple', 'banana', 'cherry', 'dog', 'elephant', 'frog', 'guitar', 'house', 'igloo', 'jacket'];

function getRandomWord() {
  return words[Math.floor(Math.random() * words.length)];
}

module.exports = getRandomWord;