import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  X, 
  PlusCircle, 
  Tag as TagIcon,
  Calendar,
  Building,
  User,
  ArrowRight
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

interface Lead {
  lead_id: number;
  client_id: number;
  property_id: number;
  agent_id: number;
  status: 'new' | 'contacted' | 'visit_scheduled' | 'offer_made' | 'deal_closed' | 'lost';
  budget: string;
  notes: string;
  last_activity: string;
  is_stale: boolean;
  client?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  property?: {
    title: string;
    price: string;
  };
  agent?: {
    first_name: string;
    last_name: string;
  };
  tags?: Array<{
    tag_id: number;
    name: string;
    color: string;
  }>;
}

interface Client {
  client_id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface Property {
  property_id: number;
  title: string;
  price: string;
}

interface Agent {
  agent_id: number;
  first_name: string;
  last_name: string;
}

interface Tag {
  tag_id: number;
  name: string;
  color: string;
}

const COLUMNS: Array<{ key: Lead['status']; title: string; color: string }> = [
  { key: 'new', title: 'New', color: '#6B7280' },
  { key: 'contacted', title: 'Contacted', color: '#3B82F6' },
  { key: 'visit_scheduled', title: 'Visit Scheduled', color: '#F59E0B' },
  { key: 'offer_made', title: 'Offer Made', color: '#EA580C' },
  { key: 'deal_closed', title: 'Closed Deal', color: '#10B981' },
  { key: 'lost', title: 'Lost', color: '#EF4444' }
];

export const Leads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Drag state
  const [draggingId, setDraggingId] = useState<number | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Form State
  const [formClientId, setFormClientId] = useState('');
  const [formPropertyId, setFormPropertyId] = useState('');
  const [formAgentId, setFormAgentId] = useState('');
  const [formBudget, setFormBudget] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<Lead['status']>('new');
  const [selectedTagId, setSelectedTagId] = useState('');

  const fetchLeads = async () => {
    try {
      const res = await api.get('/leads');
      setLeads(res.data.items || res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load pipeline leads');
    }
  };

  const fetchFormMetadata = async () => {
    try {
      const [clientRes, propRes, agentRes, tagRes] = await Promise.all([
        api.get('/clients'),
        api.get('/properties'),
        api.get('/agents'),
        api.get('/tags')
      ]);
      setClients(clientRes.data.items || clientRes.data || []);
      setProperties(propRes.data.items || propRes.data || []);
      setAgents(agentRes.data || []);
      setAllTags(tagRes.data || []);
      
      // Pre-populate fields
      if (clientRes.data.length > 0) setFormClientId(clientRes.data[0].client_id.toString());
      if (propRes.data.length > 0) setFormPropertyId(propRes.data[0].property_id.toString());
      if (agentRes.data.length > 0) setFormAgentId(agentRes.data[0].agent_id.toString());
      if (tagRes.data.length > 0) setSelectedTagId(tagRes.data[0].tag_id.toString());
    } catch (e) {
      console.error('Metadata load error', e);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchLeads(), fetchFormMetadata()]);
      setLoading(false);
    };
    init();
  }, []);

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggingId(id);
    e.dataTransfer.setData('text/plain', id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, columnKey: Lead['status']) => {
    e.preventDefault();
    const leadIdStr = e.dataTransfer.getData('text/plain') || draggingId?.toString();
    if (!leadIdStr) return;
    
    const leadId = parseInt(leadIdStr);
    const lead = leads.find((l) => l.lead_id === leadId);
    if (!lead || lead.status === columnKey) return;

    // Optimistically update UI
    setLeads((prev) => 
      prev.map((l) => l.lead_id === leadId ? { ...l, status: columnKey, last_activity: new Date().toISOString() } : l)
    );

    try {
      await api.patch(`/leads/${leadId}`, { status: columnKey });
      toast.success(`Lead moved to ${columnKey.replace('_', ' ')}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update lead status');
      fetchLeads(); // roll back
    } finally {
      setDraggingId(null);
    }
  };

  const openAddModal = () => {
    setEditingLead(null);
    setFormClientId(clients[0]?.client_id.toString() || '');
    setFormPropertyId(properties[0]?.property_id.toString() || '');
    setFormAgentId(agents[0]?.agent_id.toString() || '');
    setFormBudget('');
    setFormNotes('');
    setFormStatus('new');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientId || !formPropertyId || !formAgentId || !formBudget) {
      toast.error('Please fill in all required fields');
      return;
    }

    const payload = {
      client_id: parseInt(formClientId),
      property_id: parseInt(formPropertyId),
      agent_id: parseInt(formAgentId),
      budget: parseFloat(formBudget),
      notes: formNotes,
      status: formStatus
    };

    try {
      if (editingLead) {
        await api.patch(`/leads/${editingLead.lead_id}`, payload);
        toast.success('Lead updated successfully');
      } else {
        await api.post('/leads', payload);
        toast.success('Lead added successfully');
      }
      setIsModalOpen(false);
      fetchLeads();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save lead');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this lead from pipeline?')) return;
    try {
      await api.delete(`/leads/${id}`);
      toast.success('Lead removed from pipeline');
      fetchLeads();
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove lead');
    }
  };

  const handleAddTag = async (leadId: number) => {
    if (!selectedTagId) return;
    try {
      await api.post(`/leads/${leadId}/tags/${selectedTagId}`, {});
      toast.success('Tag assigned');
      fetchLeads();
    } catch (err) {
      console.error(err);
      toast.error('Failed to assign tag');
    }
  };

  const handleRemoveTag = async (leadId: number, tagId: number) => {
    try {
      await api.delete(`/leads/${leadId}/tags/${tagId}`);
      toast.success('Tag removed');
      fetchLeads();
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove tag');
    }
  };

  // Search filter
  const searchedLeads = leads.filter((l) => {
    const clientName = l.client ? `${l.client.first_name} ${l.client.last_name}`.toLowerCase() : '';
    const propTitle = l.property ? l.property.title.toLowerCase() : '';
    const notes = l.notes ? l.notes.toLowerCase() : '';
    const query = search.toLowerCase();
    return clientName.includes(query) || propTitle.includes(query) || notes.includes(query);
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#1A3C2E' }}>Leads Pipeline</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Drag cards across statuses to progress leads in CRM pipeline</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> New Lead
        </button>
      </div>

      {/* Search Filter Card */}
      <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flexGrow: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '16px', top: '14px', color: '#9CA3AF' }} />
            <input 
              type="text" 
              placeholder="Search leads by client name, property, or notes..." 
              className="input-field"
              style={{ paddingLeft: '44px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>Add Tag:</span>
            <select 
              className="input-field" 
              style={{ padding: '6px 36px 6px 12px', fontSize: '12px', width: '140px' }}
              value={selectedTagId}
              onChange={(e) => setSelectedTagId(e.target.value)}
            >
              {allTags.map(t => (
                <option key={t.tag_id} value={t.tag_id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div className="sidebar-logo-circle" style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite' }}>
            <Building size={18} />
          </div>
          <p style={{ color: '#6B7280' }}>Loading leads pipeline...</p>
        </div>
      ) : (
        <div className="kanban-board-container">
          {COLUMNS.map((col) => {
            const colLeads = searchedLeads.filter((l) => l.status === col.key);
            return (
              <div 
                key={col.key} 
                className="kanban-column"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.key)}
              >
                <div className="kanban-column-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col.color }}></div>
                    <span className="kanban-column-title">{col.title}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 700 }}>
                    {colLeads.length}
                  </span>
                </div>

                <div className="kanban-column-cards">
                  {colLeads.map((lead) => (
                    <div 
                      key={lead.lead_id} 
                      className={`kanban-card ${lead.is_stale ? 'stale-border' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.lead_id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#1A3C2E' }}>
                          {lead.client ? `${lead.client.first_name} ${lead.client.last_name}` : 'Unknown Client'}
                        </span>
                        <button 
                          className="topbar-icon-button" 
                          style={{ width: '20px', height: '20px', color: '#EF4444' }}
                          onClick={() => handleDelete(lead.lead_id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      <div style={{ fontSize: '11px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Building size={10} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {lead.property ? lead.property.title : 'No Property assigned'}
                        </span>
                      </div>

                      {lead.tags && lead.tags.length > 0 && (
                        <div className="kanban-card-tags">
                          {lead.tags.map((t) => (
                            <span 
                              key={t.tag_id} 
                              style={{ 
                                fontSize: '8px', 
                                padding: '1px 6px', 
                                borderRadius: '4px', 
                                backgroundColor: t.color + '20', 
                                color: t.color, 
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}
                            >
                              {t.name}
                              <X size={6} style={{ cursor: 'pointer' }} onClick={() => handleRemoveTag(lead.lead_id, t.tag_id)} />
                            </span>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', borderTop: '1px solid #F3F4F6', paddingTop: '6px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#2D6A4F' }}>
                          AED {Number(lead.budget).toLocaleString()}
                        </div>
                        
                        <button 
                          style={{
                            border: 'none',
                            background: '#E8F5EE',
                            color: '#1A3C2E',
                            borderRadius: '4px',
                            padding: '2px 4px',
                            fontSize: '8px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          onClick={() => handleAddTag(lead.lead_id)}
                        >
                          + Tag
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {colLeads.length === 0 && (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '20px 8px', 
                      color: '#9CA3AF', 
                      border: '1.5px dashed #E5E7EB', 
                      borderRadius: '12px',
                      fontSize: '10px'
                    }}>
                      Drop cards here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Lead Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1A3C2E' }}>
                Add New Lead to Pipeline
              </h3>
              <button className="topbar-icon-button" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Client *</label>
                  <select className="input-field" value={formClientId} onChange={(e) => setFormClientId(e.target.value)}>
                    {clients.map(c => (
                      <option key={c.client_id} value={c.client_id}>
                        {c.first_name} {c.last_name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Property Interest *</label>
                  <select className="input-field" value={formPropertyId} onChange={(e) => setFormPropertyId(e.target.value)}>
                    {properties.map(p => (
                      <option key={p.property_id} value={p.property_id}>
                        {p.title} (AED {Number(p.price).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Agent *</label>
                  <select className="input-field" value={formAgentId} onChange={(e) => setFormAgentId(e.target.value)}>
                    {agents.map(a => (
                      <option key={a.agent_id} value={a.agent_id}>
                        {a.first_name} {a.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Budget (AED) *</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 2000000" 
                    className="input-field"
                    value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Pipeline Status *</label>
                  <select className="input-field" value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)}>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="visit_scheduled">Visit Scheduled</option>
                    <option value="offer_made">Offer Made</option>
                    <option value="deal_closed">Deal Closed</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea 
                    placeholder="e.g. Looking to close before mid-year" 
                    className="input-field"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
