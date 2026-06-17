import { useState, useEffect } from 'react';
import { fetchProductImage, getResolvedImage, isValidLink } from '../utils/productImage';

// Resolves a preview image for a product by extracting it live from the
// product's purchase link. Images are never stored or uploaded — they are
// fetched fresh from the link each session.
//
// Returns { image, status } where status is one of:
//   'none' | 'loading' | 'loaded' | 'error'
export function useProductImage(link) {
  const [image, setImage] = useState(() => getResolvedImage(link) || null);
  const [status, setStatus] = useState(() => {
    const resolved = getResolvedImage(link);
    if (resolved === undefined) return isValidLink(link) ? 'loading' : 'none';
    return resolved ? 'loaded' : 'error';
  });

  useEffect(() => {
    let active = true;

    if (!isValidLink(link)) {
      setImage(null);
      setStatus('none');
      return;
    }

    const resolved = getResolvedImage(link);
    if (resolved !== undefined) {
      setImage(resolved || null);
      setStatus(resolved ? 'loaded' : 'error');
      return;
    }

    setStatus('loading');
    fetchProductImage(link).then((result) => {
      if (!active) return;
      setImage(result || null);
      setStatus(result ? 'loaded' : 'error');
    });

    return () => {
      active = false;
    };
  }, [link]);

  return { image, status };
}
