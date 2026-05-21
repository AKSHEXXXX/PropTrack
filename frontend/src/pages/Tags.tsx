import React, { useEffect, useState } from 'react';
import { Tag as TagIcon, Plus, Trash2, X } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

interface Tag {
  tag_id: number;
  name: string;
  color: string;
}

export const Tags: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#3B82F6');

  const fetchTags = async () => {
    try {
      const res = await api.get('/tags');
      setTags(res.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load tags');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchTags();
      setLoading(false);
    };
    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName) {
      toast.error('Please enter a tag name');
      return;
    }

    try {
      await api.post('/tags', { name: tagName, color: tagColor });
      toast.success('Tag created successfully');
      setTagName('');
      setIsModalOpen(false);
      fetchTags();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create tag');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this tag? It will be unassigned from all leads.')) return;
    try {
      await api.delete(`/tags/${id}`);
      toast.success('Tag deleted successfully');
      fetchTags();
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete tag');
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#1A3C2E' }}>Tags Management</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Define custom labels and color categories to flag leads and property interests</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> New Tag Label
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div className="sidebar-logo-circle" style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite' }}>
            <TagIcon size={18} />
          </div>
          <p style={{ color: '#6B7280' }}>Loading tag bubbles...</p>
        </div>
      ) : tags.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {tags.map((tag) => (
            <div 
              key={tag.tag_id} 
              className="card interactive"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                borderLeft: `5px solid ${tag.color}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span 
                  style={{
                    backgroundColor: tag.color + '20',
                    color: tag.color,
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontWeight: 700,
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em'
                  }}
                >
                  {tag.name}
                </span>
              </div>
              <button 
                className="topbar-icon-button" 
                style={{ width: '28px', height: '28px', color: '#EF4444' }}
                onClick={() => handleDelete(tag.tag_id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <TagIcon size={48} style={{ color: '#9CA3AF', margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1A3C2E', marginBottom: '6px' }}>No tag labels created</h3>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Create dynamic tags to classify leads on Kanban pipelines.</p>
        </div>
      )}

      {/* New Tag Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '380px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1A3C2E' }}>
                Create Custom Tag Label
              </h3>
              <button className="topbar-icon-button" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tag Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. VIP Seller" 
                    className="input-field"
                    value={tagName}
                    onChange={(e) => setTagName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Accent Theme Color *</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input 
                      type="color" 
                      className="input-field" 
                      style={{ padding: '2px', width: '50px', height: '40px', cursor: 'pointer' }}
                      value={tagColor}
                      onChange={(e) => setTagColor(e.target.value)}
                    />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', fontFamily: 'monospace' }}>
                      {tagColor.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
