import React, { useState } from 'react';
import { useStorage } from './hooks/useStorage';
import InventoryTab from './components/InventoryTab';
import AddItemModal from './components/AddItemModal';
import itemsData from './data/items.json';
import { ShoppingCart, Sparkles } from 'lucide-react';

function App() {
  // Shopping Tracker states (loads default from items.json)
  const [items, setItems] = useStorage('items', itemsData);
  const [budget, setBudget] = useStorage('budget', 5000.00);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // GitHub Sync states
  const [githubToken, setGithubToken] = useStorage('githubToken', '');
  const [githubRepo, setGithubRepo] = useStorage('githubRepo', 'HrishikeshBharadwajC/webtracker_apartment');
  const [githubBranch, setGithubBranch] = useStorage('githubBranch', 'main');
  const [syncStatus, setSyncStatus] = useState('');

  // Sync to GitHub API function
  const syncToGitHub = async (newItems) => {
    if (!githubToken || !githubRepo) return;
    
    setSyncStatus('Syncing with GitHub...');
    try {
      const [owner, repo] = githubRepo.split('/');
      if (!owner || !repo) {
        throw new Error('Invalid repository format. Use owner/repo.');
      }
      
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/src/data/items.json`;
      const headers = {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      };

      // 1. Fetch current file SHA (required by GitHub API to update files)
      let sha = null;
      try {
        const getRes = await fetch(`${url}?ref=${githubBranch}`, { headers });
        if (getRes.status === 200) {
          const data = await getRes.json();
          sha = data.sha;
        } else if (getRes.status !== 404) {
          throw new Error(`Failed to fetch file info: status ${getRes.status}`);
        }
      } catch (err) {
        console.error('Error fetching SHA:', err);
      }

      // 2. Commit updated file content
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(newItems, null, 2))));
      const body = {
        message: 'Update items.json via NestSpace Move Tracker UI',
        content,
        branch: githubBranch
      };
      if (sha) {
        body.sha = sha;
      }

      const putRes = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
      });

      if (putRes.ok) {
        setSyncStatus('Saved directly to GitHub!');
        setTimeout(() => setSyncStatus(''), 4000);
      } else {
        const errData = await putRes.json();
        throw new Error(errData.message || 'Failed to commit file.');
      }
    } catch (error) {
      console.error('GitHub Sync Error:', error);
      setSyncStatus(`Sync Error: ${error.message}`);
    }
  };

  // Budget calculations
  const totalCost = items.reduce((acc, item) => acc + item.cost, 0);

  const handleAddItem = (newItem) => {
    const updated = [...items, newItem];
    setItems(updated);
    syncToGitHub(updated);
  };

  const handleEditItem = (updatedItem) => {
    const updated = items.map(item => item.id === updatedItem.id ? updatedItem : item);
    setItems(updated);
    syncToGitHub(updated);
  };

  const handleDeleteItem = (itemId) => {
    const updated = items.filter(item => item.id !== itemId);
    setItems(updated);
    syncToGitHub(updated);
  };

  return (
    <>
      {/* Premium Glassmorphic Header */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">
            <Sparkles size={20} color="#070913" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', lineHeight: '1.2' }}>NestSpace</h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Apartment Move Tracker
            </span>
          </div>
        </div>

        {/* Header Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <ShoppingCart size={18} color="var(--cyan)" />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Shopping Inventory</span>
        </div>

        {/* Simple Top Metric */}
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Spent: <strong style={{ color: totalCost > budget ? '#f43f5e' : 'var(--cyan)' }}>
              ${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </strong>
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Limit: ${budget.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="app-container">
        <InventoryTab 
          items={items}
          onDeleteItem={handleDeleteItem}
          onOpenAddModal={() => { setEditItem(null); setIsAddModalOpen(true); }}
          onOpenEditModal={(item) => { setEditItem(item); setIsAddModalOpen(true); }}
          budget={budget}
          onUpdateBudget={setBudget}
          githubToken={githubToken}
          setGithubToken={setGithubToken}
          githubRepo={githubRepo}
          setGithubRepo={setGithubRepo}
          githubBranch={githubBranch}
          setGithubBranch={setGithubBranch}
          syncStatus={syncStatus}
          syncToGitHub={syncToGitHub}
        />
      </main>

      {/* Item intake Modal */}
      <AddItemModal 
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditItem(null); }}
        onAddItem={handleAddItem}
        onEditItem={handleEditItem}
        editItem={editItem}
      />
    </>
  );
}

export default App;
