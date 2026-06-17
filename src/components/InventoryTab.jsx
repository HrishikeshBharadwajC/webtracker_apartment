import React, { useState } from 'react';
import { Plus, Search, Trash2, ShoppingBag, DollarSign, Wallet, CheckCircle, ExternalLink, HelpCircle, Edit, Download, Info } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Bedroom Furniture',
  'Appliances',
  'Kitchen Items',
  'Packing Items',
  'Smart Home Gadgets',
  'Other'
];

export default function InventoryTab({ 
  items, 
  onDeleteItem, 
  onOpenAddModal, 
  onOpenEditModal, 
  budget, 
  onUpdateBudget
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(budget);

  const downloadCSV = () => {
    const headers = ['ID', 'Name', 'Category', 'Cost', 'Status', 'Link', 'Dimensions (W x D x H)'];
    
    const rows = items.map(item => {
      const w = item.dimensions?.width || '';
      const d = item.dimensions?.depth || '';
      const h = item.dimensions?.height || '';
      const dimsStr = w || d || h ? `${w}x${d}x${h}` : '';
      
      const escapedName = `"${item.name.replace(/"/g, '""')}"`;
      const escapedLink = item.link ? `"${item.link.replace(/"/g, '""')}"` : '""';
      
      return [
        item.id,
        escapedName,
        item.category,
        item.cost,
        item.status,
        escapedLink,
        dimsStr
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", "apartment_items.csv");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Calculations
  const totalCost = items.reduce((acc, item) => acc + item.cost, 0);
  const remainingBudget = budget - totalCost;
  const percentSpent = budget > 0 ? Math.min(100, Math.round((totalCost / budget) * 100)) : 0;
  
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleBudgetSubmit = (e) => {
    e.preventDefault();
    onUpdateBudget(parseFloat(tempBudget) || 0);
    setIsEditingBudget(false);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Arrived': return 'status-badge status-arrived';
      case 'Ordered': return 'status-badge status-ordered';
      default: return 'status-badge status-to-buy';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Budget & Stats Dashboard */}
      <div className="dashboard-summary">
        
        {/* Total Budget Card */}
        <div className="glass-panel summary-card">
          <div className="summary-icon-container" style={{ background: 'var(--purple-glow)' }}>
            <Wallet size={24} color="var(--purple)" />
          </div>
          <div className="summary-details" style={{ flex: 1 }}>
            <h3>Total Budget</h3>
            {isEditingBudget ? (
              <form onSubmit={handleBudgetSubmit} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <input 
                  type="number" 
                  className="form-input" 
                  value={tempBudget}
                  onChange={(e) => setTempBudget(e.target.value)}
                  style={{ padding: '0.25rem 0.5rem', fontSize: '1rem', width: '100px' }}
                  autoFocus
                  onBlur={() => setIsEditingBudget(false)}
                />
                <button type="submit" className="submit-btn" style={{ padding: '0.25rem 0.5rem', margin: 0, fontSize: '0.85rem' }}>
                  Save
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="summary-value">${budget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <button 
                  onClick={() => { setTempBudget(budget); setIsEditingBudget(true); }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    textDecoration: 'underline'
                  }}
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Total Cost Card */}
        <div className="glass-panel summary-card">
          <div className="summary-icon-container" style={{ background: 'var(--cyan-glow)' }}>
            <DollarSign size={24} color="var(--cyan)" />
          </div>
          <div className="summary-details">
            <h3>Estimated Spent</h3>
            <span className="summary-value" style={{ color: totalCost > budget ? '#f43f5e' : 'inherit' }}>
              ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Remaining Budget Card */}
        <div className="glass-panel summary-card">
          <div className="summary-icon-container" style={{ 
            background: remainingBudget < 0 ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)' 
          }}>
            <ShoppingBag size={24} color={remainingBudget < 0 ? '#f43f5e' : '#10b981'} />
          </div>
          <div className="summary-details">
            <h3>Remaining</h3>
            <span className="summary-value" style={{ color: remainingBudget < 0 ? '#f43f5e' : '#10b981' }}>
              ${remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Radial Progress Gauge Card */}
        <div className="glass-panel summary-card" style={{ justifyContent: 'center' }}>
          <div className="budget-radial-container">
            <svg className="radial-svg">
              <circle className="radial-bg" cx="35" cy="35" r="30" />
              <circle 
                className="radial-progress" 
                cx="35" 
                cy="35" 
                r="30" 
                style={{
                  stroke: totalCost > budget ? '#f43f5e' : 'var(--cyan)',
                  strokeDasharray: 2 * Math.PI * 30,
                  strokeDashoffset: 2 * Math.PI * 30 * (1 - percentSpent / 100)
                }}
              />
            </svg>
            <div>
              <span className="summary-value" style={{ fontSize: '1.25rem' }}>{percentSpent}%</span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Budget Used</p>
            </div>
          </div>
        </div>

      </div>

      {/* Action Filters Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div className="filter-bar">
          
          {/* Category Tabs */}
          <div className="category-tags">
            {CATEGORIES.map(cat => (
              <button 
                key={cat} 
                className={`cat-tag ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search and Add */}
          <div style={{ display: 'flex', gap: '1rem', flex: 1, justifyContent: 'flex-end', minWidth: '300px' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '280px' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.5rem', paddingRight: '1rem' }}
              />
              <Search size={16} color="var(--text-muted)" style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)'
              }} />
            </div>
            <button 
              className="submit-btn" 
              onClick={downloadCSV} 
              style={{ 
                margin: 0, 
                width: 'auto',
                background: 'var(--grad-purple)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
              title="Export items to CSV for Excel/Google Sheets"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button className="submit-btn" onClick={onOpenAddModal} style={{ margin: 0, width: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={16} />
              Add Item
            </button>
          </div>

        </div>
      </div>

      {/* Items Display Grid */}
      {filteredItems.length === 0 ? (
        <div className="glass-panel empty-state">
          <HelpCircle size={48} className="empty-icon" />
          <h3>No items found</h3>
          <p style={{ maxWidth: '400px', fontSize: '0.9rem' }}>
            {search || selectedCategory !== 'All' 
              ? "Try adjusting your filters or search keywords to locate your apartment items."
              : "Start by clicking 'Add Item' above and paste links to create your apartment shopping list."}
          </p>
        </div>
      ) : (
        <div className="items-grid">
          {filteredItems.map(item => (
            <div key={item.id} className="glass-panel item-card">
              
              {/* Card top */}
              <div>
                <div className="item-header">
                  <span className="item-category">{item.category}</span>
                  {item.link && (
                    <a 
                      href={item.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="item-link-btn"
                      title="View product store page"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
                <h4 className="item-title">{item.name}</h4>
                
                <div className="item-meta">
                  {item.dimensions && (item.dimensions.width > 0 || item.dimensions.depth > 0 || item.dimensions.height > 0) ? (
                    <span className="item-dims">
                      📏 {item.dimensions.width}"w × {item.dimensions.depth}"d × {item.dimensions.height}"h
                    </span>
                  ) : (
                    <span className="item-dims" style={{ opacity: 0.5 }}>
                      📏 No dimensions specified
                    </span>
                  )}
                </div>
              </div>

              {/* Card bottom */}
              <div>
                <span className="item-cost">${item.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <div className="item-footer">
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={getStatusClass(item.status)}>{item.status}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <button 
                      className="delete-item-btn" 
                      onClick={() => onOpenEditModal(item)} 
                      style={{ marginRight: '0.25rem' }} 
                      title="Edit Item"
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--cyan)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Edit size={16} />
                    </button>
                    <button className="delete-item-btn" onClick={() => onDeleteItem(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
