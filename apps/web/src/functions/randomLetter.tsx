export function generateRandomCombo(): string {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
  
    // Generate 4 random lowercase letters
    const randomLetters = Array.from({ length: 4 }, () => {
      return letters[Math.floor(Math.random() * letters.length)];
    });
  
    // Generate 1 random digit
    const randomNumber = numbers[Math.floor(Math.random() * numbers.length)];
  
    // Insert the number at a random position among the letters
    const insertIndex = Math.floor(Math.random() * 5);
    randomLetters.splice(insertIndex, 0, randomNumber);
  
    return randomLetters.join('');
  }

export function pickRandomCard(cardsArray:[]) {
  const randomIndex = Math.floor(Math.random() * cardsArray.length);
  return cardsArray[randomIndex];
}