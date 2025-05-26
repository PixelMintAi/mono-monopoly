export const saveToStorage = (key: string, value: any) => {
    try {
      localStorage.setItem(`monopoly_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  };
  
  export const loadFromStorage = (key: string, defaultValue: any = null) => {
    try {
      const saved = localStorage.getItem(`monopoly_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return defaultValue;
    }
  };
  
  export const clearAllStorage = () => {
    const keys = [
      'roomId', 'username', 'playerUUID', 'gameState', 
      'waitingStatus', 'messages', 'currentPage', 'roomSettings'
    ];
    keys.forEach(key => {
      try {
        localStorage.removeItem(`monopoly_${key}`);
      } catch (error) {
        console.error('Failed to clear localStorage:', error);
      }
    });
  };
  
  //rejoin new client id