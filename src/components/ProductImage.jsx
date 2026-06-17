import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Loader } from 'lucide-react';
import { useProductImage } from '../hooks/useProductImage';

// Displays a product preview image extracted from its purchase link.
// Shows a spinner while resolving and a graceful placeholder when no image
// is available (or the image fails to load).
export default function ProductImage({ link, alt, className = '' }) {
  const { image, status } = useProductImage(link);
  const [broken, setBroken] = useState(false);

  // Reset the broken flag whenever the resolved image changes.
  useEffect(() => {
    setBroken(false);
  }, [image]);

  const showImage = image && !broken;

  return (
    <div className={`item-image-wrap ${className}`}>
      {showImage ? (
        <img
          src={image}
          alt={alt || 'Product image'}
          loading="lazy"
          onError={() => setBroken(true)}
        />
      ) : status === 'loading' ? (
        <div className="item-image-placeholder">
          <Loader size={22} className="item-image-spinner" />
          <span>Fetching image…</span>
        </div>
      ) : (
        <div className="item-image-placeholder">
          <ImageIcon size={26} />
          <span>No image</span>
        </div>
      )}
    </div>
  );
}
