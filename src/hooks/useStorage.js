import { useState, useEffect } from 'react';

export function useStorage(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading localStorage key', key, error);
      return initialValue;
    }
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.error('Error setting localStorage key', key, error);
      }
    }, 300); // 300ms debounce to prevent drag lag

    return () => {
      clearTimeout(handler);
    };
  }, [key, state]);

  return [state, setState];
}
