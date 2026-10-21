import { useCallback, useState } from 'react';

const KEY = 'toolshare_favs';

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch (e) {
    return [];
  }
}

// Wishlist stored on this device (no login needed)
export function useFavorites() {
  const [favs, setFavs] = useState(read);

  const toggle = useCallback((id) => {
    setFavs((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch (e) {
        /* storage blocked */
      }
      return next;
    });
  }, []);

  return { favs, toggle };
}
