import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Loader } from 'lucide-react';
import { useProductImage } from '../hooks/useProductImage';
import { proxiedImageUrl } from '../utils/productImage';

// Displays a product preview image extracted from its purchase link.
// Shows a spinner while resolving and a graceful placeholder when no image
// is available (or the image fails to load).
export default function ProductImage({ link, alt, className = '' }) {
  const { image, status } = useProductImage(link);
  // Load attempt: 'direct' -> original URL, 'proxy' -> retry via image proxy,
  // 'broken' -> give up and show the placeholder.
  const [attempt, setAttempt] = useState('direct');

  // Restart the load sequence whenever the resolved image changes.
  useEffect(() => {
    setAttempt('direct');
  }, [image]);

  const src = image ? (attempt === 'proxy' ? proxiedImageUrl(image) : image) : null;
  const showImage = !!src && attempt !== 'broken';

  const handleError = () => {
    // Retailer CDNs often hotlink-protect images (cross-origin 403). Retry once
    // through an image proxy before falling back to the placeholder.
    setAttempt((prev) => (prev === 'direct' ? 'proxy' : 'broken'));
  };

  return (
    <div className={`item-image-wrap ${className}`}>
      {showImage ? (
        <img
          src={src}
          alt={alt || 'Product image'}
          loading="lazy"
          onError={handleError}
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
