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
  onUpdateBudget,
  supabaseUrl,
  setSupabaseUrl,
  supabaseKey,
  setSupabaseKey,
  dbSyncStatus,
  onMigrate
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(budget);
  const [showDbBanner, setShowDbBanner] = useState(true);
  const [showDbSettings, setShowDbSettings] = useState(false);

  const downloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "items.json");
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

      {/* Supabase Sync Banner */}
      {showDbBanner && (
        <div className="glass-panel" style={{ 
          padding: '1rem 1.5rem', 
          borderLeft: '4px solid var(--cyan)', 
          display: 'flex', 
          gap: '1rem', 
          alignItems: 'center',
          position: 'relative',
          flexWrap: 'wrap'
        }}>
          <div style={{
            background: 'var(--cyan-glow)',
            padding: '0.4rem',
            borderRadius: '6px',
            color: 'var(--cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Info size={18} />
          </div>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>Real-time Database Sync Available</h4>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Connect a free **Supabase** database to sync your items across all devices. No Personal Access Tokens required! Click <strong>Link Database</strong> below to configure.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              onClick={() => setShowDbSettings(!showDbSettings)}
              style={{
                background: showDbSettings ? 'rgba(0, 242, 254, 0.2)' : 'rgba(0, 242, 254, 0.1)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                color: 'var(--cyan)',
                cursor: 'pointer',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
            >
              {showDbSettings ? 'Hide Config' : 'Link Database'}
            </button>
            <button 
              onClick={() => setShowDbBanner(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                textDecoration: 'underline',
                padding: '0.2rem'
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Supabase Sync Settings Panel */}
      {showDbSettings && (
        <div className="glass-panel" style={{ 
          padding: '1.25rem 1.5rem', 
          borderTop: '1px solid var(--border-glass)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          animation: 'slideDown 0.2s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              ⚙️ Supabase Database Connection
            </h4>
            <span style={{ 
              fontSize: '0.75rem', 
              color: dbSyncStatus === 'connected' ? '#10b981' : dbSyncStatus.includes('error') ? '#ff85a1' : 'var(--cyan)',
              background: 'rgba(255,255,255,0.05)',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              textTransform: 'capitalize'
            }}>
              Status: {dbSyncStatus}
            </span>
          </div>
          
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            To save items without a PAT: Create a free database at <strong><a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cyan)', textDecoration: 'underline' }}>supabase.com</a></strong>, run the SQL setup script to create the <code>items</code> table, and paste your public credentials below.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>
                Supabase Project URL
              </label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="https://your-project-id.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>
                Supabase Anon Public API Key
              </label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="public-anon-key"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
              />
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-glass)',
            borderRadius: '6px',
            padding: '0.75rem 1rem',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)'
          }}>
            <strong>SQL Schema Setup:</strong> Run this script in the Supabase SQL Editor to create your table and configure permissions:
            <pre style={{ 
              background: 'rgba(0,0,0,0.3)', 
              padding: '0.5rem', 
              borderRadius: '4px', 
              overflowX: 'auto', 
              fontSize: '0.7rem',
              fontFamily: 'monospace',
              color: '#a5f3fc',
              marginTop: '0.5rem',
              userSelect: 'all'
            }}>
{`create table items (
  id text primary key,
  name text not null,
  link text,
  category text,
  cost numeric default 0,
  status text default 'To Buy',
  dimensions jsonb default '{"width": 0, "depth": 0, "height": 0}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table items enable row level security;
create policy "Allow read" on items for select using (true);
create policy "Allow insert" on items for insert with check (true);
create policy "Allow update" on items for update using (true);
create policy "Allow delete" on items for delete using (true);`}
            </pre>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button 
              onClick={onMigrate}
              disabled={dbSyncStatus !== 'connected'}
              className="submit-btn"
              style={{ 
                margin: 0, 
                width: 'auto',
                padding: '0.4rem 1rem',
                fontSize: '0.8rem',
                opacity: dbSyncStatus !== 'connected' ? 0.5 : 1,
                cursor: dbSyncStatus !== 'connected' ? 'not-allowed' : 'pointer'
              }}
            >
              Upload Local Items to Database
            </button>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              🔓 Note: These public keys are safe to commit to Git or share.
            </span>
          </div>
        </div>
      )}

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
              onClick={downloadJSON} 
              style={{ 
                margin: 0, 
                width: 'auto',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
              title="Download items.json file to save back to Git"
            >
              <Download size={16} />
              Download JSON
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
