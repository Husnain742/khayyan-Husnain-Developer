import { useEffect, useState } from 'react';

export function useDebounce(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function usePageTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} | Khayyan Memorial Portal` : 'Khayyan Memorial Portal';
    return () => { document.title = prev; };
  }, [title]);
}
