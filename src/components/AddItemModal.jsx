import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Sparkles, Image as ImageIcon } from 'lucide-react';
import ProductImage from './ProductImage';

const CATEGORIES = [
  'Bedroom Furniture',
  'Appliances',
  'Kitchen Items',
  'Packing Items',
  'Smart Home Gadgets',
  'Other'
];

export default function AddItemModal({ isOpen, onClose, onAddItem, onEditItem, editItem }) {
  const [link, setLink] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Bedroom Furniture');
  const [cost, setCost] = useState('');
  const [status, setStatus] = useState('To Buy');
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState('');
  const [height, setHeight] = useState('');

  const [parsingMsg, setParsingMsg] = useState('');

  // Populate fields if editing
  useEffect(() => {
    if (editItem) {
      setLink(editItem.link || '');
      setName(editItem.name || '');
      setCategory(editItem.category || 'Bedroom Furniture');
      setCost(editItem.cost !== undefined && editItem.cost !== null ? editItem.cost.toString() : '');
      setStatus(editItem.status || 'To Buy');
      setWidth(editItem.dimensions?.width !== undefined ? editItem.dimensions.width.toString() : '');
      setDepth(editItem.dimensions?.depth !== undefined ? editItem.dimensions.depth.toString() : '');
      setHeight(editItem.dimensions?.height !== undefined ? editItem.dimensions.height.toString() : '');
      setParsingMsg('');
    } else {
      handleReset();
    }
  }, [editItem, isOpen]);

  // Auto-parse URL when pasted (only in add mode to avoid overwriting edits)
  useEffect(() => {
    if (editItem || !link) {
      setParsingMsg('');
      return;
    }

    try {
      const url = new URL(link);
      setParsingMsg('Parsing link details...');

      // simple heuristics for domain names
      let detectedName = '';
      let detectedCategory = '';
      let defaultWidth = '';
      let defaultDepth = '';
      let defaultHeight = '';

      const pathSegments = url.pathname.split('/').filter(Boolean);

      if (url.hostname.includes('ikea.com')) {
        const pIndex = pathSegments.indexOf('p');
        if (pIndex !== -1 && pathSegments[pIndex + 1]) {
          const rawName = pathSegments[pIndex + 1];
          const nameClean = rawName.split('-').slice(0, -1).join(' ');
          detectedName = capitalizeWords(nameClean || rawName.split('-').join(' '));
        } else {
          detectedName = 'Ikea Product';
        }
        detectedCategory = 'Bedroom Furniture';
        defaultWidth = '80';
        defaultDepth = '36';
        defaultHeight = '30';
      } else if (url.hostname.includes('amazon.com')) {
        const dpIndex = pathSegments.indexOf('dp');
        if (dpIndex > 0) {
          const rawName = pathSegments[dpIndex - 1];
          detectedName = capitalizeWords(rawName.split('-').join(' '));
        } else if (pathSegments[0] && pathSegments[0] !== 'dp') {
          detectedName = capitalizeWords(pathSegments[0].split('-').join(' '));
        } else {
          detectedName = 'Amazon Product';
        }
        detectedCategory = 'Smart Home Gadgets';
      } else {
        const lastSegment = pathSegments[pathSegments.length - 1] || '';
        if (lastSegment) {
          detectedName = capitalizeWords(lastSegment.split(/[-_]/).join(' '));
        } else {
          detectedName = url.hostname.replace('www.', '');
        }
      }

      if (detectedName) {
        detectedName = detectedName.split(/[?#]/)[0].substring(0, 45);
      }

      setTimeout(() => {
        if (detectedName) setName(detectedName);
        if (detectedCategory) setCategory(detectedCategory);
        if (defaultWidth) setWidth(defaultWidth);
        if (defaultDepth) setDepth(defaultDepth);
        if (defaultHeight) setHeight(defaultHeight);
        setParsingMsg('✨ Successfully auto-filled fields from link!');
      }, 500);

    } catch (e) {
      setParsingMsg('Invalid link format. Enter standard HTTP URL.');
    }
  }, [link, editItem]);

  const capitalizeWords = (str) => {
    return str
      .replace(/\+/g, ' ')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const itemData = {
      id: editItem ? editItem.id : 'item_' + Date.now(),
      link,
      name,
      category,
      cost: parseFloat(cost) || 0,
      status,
      dimensions: {
        width: parseFloat(width) || 0,
        depth: parseFloat(depth) || 0,
        height: parseFloat(height) || 0
      }
    };

    if (editItem) {
      onEditItem(itemData);
    } else {
      onAddItem(itemData);
    }
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setLink('');
    setName('');
    setCategory('Bedroom Furniture');
    setCost('');
    setStatus('To Buy');
    setWidth('');
    setDepth('');
    setHeight('');
    setParsingMsg('');
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(8px)',
      padding: '1rem'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '520px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        animation: 'slideUp 0.3s ease'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="var(--cyan)" />
            {editItem ? "Edit Apartment Item" : "Add New Apartment Item"}
          </h2>
          <button onClick={() => { handleReset(); onClose(); }} style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="intake-form-container">
          
          {/* Link paste input */}
          <div className="form-group">
            <label>Paste Purchase Link (Auto-extracts info)</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="form-input"
                placeholder="https://www.ikea.com/us/en/p/..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <LinkIcon size={16} color="var(--text-muted)" style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)'
              }} />
            </div>
            {parsingMsg && (
              <span style={{
                fontSize: '0.75rem',
                color: parsingMsg.includes('Successfully') ? 'var(--cyan)' : '#ff85a1',
                marginTop: '0.25rem',
                display: 'block'
              }}>
                {parsingMsg}
              </span>
            )}
          </div>

          {/* Auto-extracted product image preview (captured from the link) */}
          {link && (
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ImageIcon size={14} color="var(--cyan)" />
                Product Image (auto-captured from link)
              </label>
              <ProductImage link={link} alt={name || 'Product preview'} className="modal-image-preview" />
            </div>
          )}

          {/* Name & Cost */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Item Name *</label>
              <input 
                type="text" 
                required
                className="form-input"
                placeholder="e.g. Malm Bed Frame"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Cost ($)</label>
              <input 
                type="number" 
                step="0.01"
                className="form-input"
                placeholder="199.99"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
          </div>

          {/* Category & Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Category</label>
              <select 
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Purchase Status</label>
              <select 
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="To Buy">To Buy</option>
                <option value="Ordered">Ordered</option>
                <option value="Arrived">Arrived</option>
              </select>
            </div>
          </div>

          {/* Dimensions */}
          <div className="form-group">
            <label>Dimensions (Inches - optional)</label>
            <div className="dim-row">
              <div className="dim-input-wrapper">
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Width"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                />
                <span className="dim-unit">W</span>
              </div>
              <div className="dim-input-wrapper">
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Depth"
                  value={depth}
                  onChange={(e) => setDepth(e.target.value)}
                />
                <span className="dim-unit">D</span>
              </div>
              <div className="dim-input-wrapper">
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Height"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
                <span className="dim-unit">H</span>
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Note: 12 inches = 1 foot.
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button 
              type="button" 
              onClick={() => { handleReset(); onClose(); }}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-glass)',
                color: '#ffffff',
                padding: '0.85rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Cancel
            </button>
            <button type="submit" className="submit-btn" style={{ flex: 2, marginTop: 0 }}>
              {editItem ? "Save Changes" : "Add to Tracker"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
