import React, { useState, useEffect } from 'react';
import { useStorage } from './hooks/useStorage';
import InventoryTab from './components/InventoryTab';
import AddItemModal from './components/AddItemModal';
import itemsData from './data/items.json';
import { updateSupabaseClient } from './supabaseClient';
import { ShoppingCart, Sparkles } from 'lucide-react';

function App() {
  // Shopping Tracker states (loads default from items.json)
  const [items, setItems] = useStorage('items', itemsData);
  const [budget, setBudget] = useStorage('budget', 5000.00);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Supabase Sync states
  const [supabaseUrl, setSupabaseUrl] = useStorage('supabaseUrl', 'https://fijgrrqlrtqugpaxbtlz.supabase.co');
  const [supabaseKey, setSupabaseKey] = useStorage('supabaseKey', 'sb_publishable_VK1Bv8nLZPpBbvhab8minw_XJzENMsi');
  const [dbSyncStatus, setDbSyncStatus] = useState('disconnected');

  // Upgrade empty or outdated local storage keys to hardcoded defaults
  useEffect(() => {
    if (supabaseUrl === '' || supabaseUrl === 'https://VK1Bv8nLZPpBbvhab8minw.supabase.co') {
      setSupabaseUrl('https://fijgrrqlrtqugpaxbtlz.supabase.co');
    }
    if (supabaseKey === '') {
      setSupabaseKey('sb_publishable_VK1Bv8nLZPpBbvhab8minw_XJzENMsi');
    }
  }, []);

  // Load items from Supabase when connected (and auto-migrate if empty)
  useEffect(() => {
    const fetchDbItems = async () => {
      if (!supabaseUrl || !supabaseKey) {
        setDbSyncStatus('disconnected');
        return;
      }
      
      setDbSyncStatus('connecting');
      try {
        const client = updateSupabaseClient(supabaseUrl, supabaseKey);
        if (!client) {
          throw new Error('Could not initialize database client.');
        }
        
        const { data, error } = await client
          .from('items')
          .select('*')
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        
        if (data) {
          if (data.length === 0 && items.length > 0) {
            // Auto-migrate local items to database if empty
            setDbSyncStatus('migrating');
            const { error: upsertError } = await client
              .from('items')
              .upsert(items, { onConflict: 'id' });
            if (upsertError) throw upsertError;
            setDbSyncStatus('connected');
          } else {
            setItems(data);
            setDbSyncStatus('connected');
          }
        }
      } catch (err) {
        console.error('Supabase fetch error:', err);
        setDbSyncStatus(`error: ${err.message}`);
      }
    };
    
    fetchDbItems();
  }, [supabaseUrl, supabaseKey]);

  // Budget calculations
  const totalCost = items.reduce((acc, item) => acc + item.cost, 0);

  const handleAddItem = async (newItem) => {
    const updated = [...items, newItem];
    setItems(updated);
    
    if (supabaseUrl && supabaseKey) {
      try {
        const client = updateSupabaseClient(supabaseUrl, supabaseKey);
        const { error } = await client
          .from('items')
          .insert([newItem]);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to insert item to Supabase:', err);
        alert(`Error saving to database: ${err.message}`);
      }
    }
  };

  const handleEditItem = async (updatedItem) => {
    const updated = items.map(item => item.id === updatedItem.id ? updatedItem : item);
    setItems(updated);
    
    if (supabaseUrl && supabaseKey) {
      try {
        const client = updateSupabaseClient(supabaseUrl, supabaseKey);
        const { error } = await client
          .from('items')
          .update(updatedItem)
          .eq('id', updatedItem.id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to update item in Supabase:', err);
        alert(`Error updating database: ${err.message}`);
      }
    }
  };

  const handleDeleteItem = async (itemId) => {
    const updated = items.filter(item => item.id !== itemId);
    setItems(updated);
    
    if (supabaseUrl && supabaseKey) {
      try {
        const client = updateSupabaseClient(supabaseUrl, supabaseKey);
        const { error } = await client
          .from('items')
          .delete()
          .eq('id', itemId);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to delete item from Supabase:', err);
        alert(`Error deleting from database: ${err.message}`);
      }
    }
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
