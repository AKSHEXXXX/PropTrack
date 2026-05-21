import React, { useEffect, useState } from 'react';
import { UserSquare2, Plus, Search, Trash2, Edit3, X, Mail, Phone, Percent, Check, AlertTriangle, Eye } from 'lucide-react';
import api from '../api/axios';
import { Avatar } from '../components/ui/Avatar';
import toast from 'react-hot-toast';

interface Agent {
  agent_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  commission_rate: string;
  is_active: boolean;
  active_leads_count?: number;
  closed_deals_count?: number;
  total_sales_volume?: string;
  total_commission_earned?: string;
}

interface Lead {
  lead_id: number;
  status: string;
  budget: string;
  client?: { first_name: string; last_name: string; };
  property?: { title: string; };
}

interface Deal {
  deal_id: number;
  status: string;
  final_price: string;
  commission_amount: string;
  property?: { title: string; };
}

export const Agents: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals & Panels
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  
  // Selected Agent Details panel
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentLeads, setAgentLeads] = useState<Lead[]>([]);
  const [agentDeals, setAgentDeals] = useState<Deal[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'leads' | 'deals'>('stats');

  // Form State
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCommissionRate, setFormCommissionRate] = useState('0.025');

  const fetchAgents = async () => {
    try {
      const res = await api.get('/agents');
      setAgents(res.data.items || res.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load agents list');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchAgents();
      setLoading(false);
    };
    init();
  }, []);

  const openAddModal = () => {
    setEditingAgent(null);
    setFormFirstName('');
    setFormLastName('');
    setFormEmail('');
    setFormPhone('');
    setFormCommissionRate('0.025');
    setIsModalOpen(true);
  };

  const openEditModal = (agent: Agent) => {
    setEditingAgent(agent);
    setFormFirstName(agent.first_name);
    setFormLastName(agent.last_name);
    setFormEmail(agent.email);
    setFormPhone(agent.phone);
    setFormCommissionRate(agent.commission_rate.toString());
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to deactivate this agent?')) return;
    try {
      await api.delete(`/agents/${id}`);
      toast.success('Agent deactivated successfully');
      fetchAgents();
      if (selectedAgent?.agent_id === id) {
        setSelectedAgent(null);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to deactivate agent');
    }
  };

  const handleSelectAgent = async (agent: Agent) => {
    setSelectedAgent(agent);
    setActiveTab('stats');
    try {
      const [leadsRes, dealsRes, detailRes] = await Promise.all([
        api.get(`/agents/${agent.agent_id}/leads`),
        api.get(`/agents/${agent.agent_id}/deals`),
        api.get(`/agents/${agent.agent_id}`)
      ]);
      setAgentLeads(leadsRes.data || []);
      setAgentDeals(dealsRes.data || []);
      
      // Update selected agent stats
      if (detailRes.data) {
        setSelectedAgent({ ...agent, ...detailRes.data });
      }
    } catch (e) {
      console.error('Failed to load agent profile details', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFirstName || !formLastName || !formEmail || !formPhone) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Hardcode agency_id to 1 as it is seeded default agency
    const payload = {
      agency_id: 1,
      first_name: formFirstName,
      last_name: formLastName,
      email: formEmail,
      phone: formPhone,
      commission_rate: parseFloat(formCommissionRate),
    };

    try {
      if (editingAgent) {
        await api.patch(`/agents/${editingAgent.agent_id}`, payload);
        toast.success('Agent updated successfully');
      } else {
        await api.post('/agents', payload);
        toast.success('Agent registered successfully');
      }
      setIsModalOpen(false);
      fetchAgents();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save agent details');
    }
  };

  const filteredAgents = agents.filter((a) => {
    const fullName = `${a.first_name} ${a.last_name}`.toLowerCase();
    return fullName.includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#1A3C2E' }}>Agent Directory</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Track commission rates, active listings and check individual agent performances</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Register Agent
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedAgent ? '1.8fr 1.2fr' : '1fr', gap: '20px' }}>
        {/* Left Side: Agents List */}
        <div>
          <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '16px', top: '14px', color: '#9CA3AF' }} />
              <input 
                type="text" 
                placeholder="Search agents by name or email..." 
                className="input-field"
                style={{ paddingLeft: '44px' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div className="sidebar-logo-circle" style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite' }}>
                <UserSquare2 size={18} />
              </div>
              <p style={{ color: '#6B7280' }}>Loading team directory...</p>
            </div>
          ) : filteredAgents.length > 0 ? (
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Commission Rate</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map((agent) => (
                    <tr 
                      key={agent.agent_id} 
                      style={{ 
                        cursor: 'pointer',
                        backgroundColor: selectedAgent?.agent_id === agent.agent_id ? '#F4F6F4' : 'transparent' 
                      }}
                      onClick={() => handleSelectAgent(agent)}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Avatar name={`${agent.first_name} ${agent.last_name}`} size="sm" />
                          <span style={{ fontWeight: 600 }}>{agent.first_name} {agent.last_name}</span>
                        </div>
                      </td>
                      <td>{agent.email}</td>
                      <td>{agent.phone}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2D6A4F', fontWeight: 600 }}>
                          <Percent size={12} /> {Math.round(Number(agent.commission_rate) * 1000) / 10}%
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${agent.is_active ? 'active' : 'inactive'}`}>
                          {agent.is_active ? 'active' : 'inactive'}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="topbar-icon-button" style={{ width: '28px', height: '28px' }} onClick={() => handleSelectAgent(agent)}>
                            <Eye size={14} />
                          </button>
                          <button className="topbar-icon-button" style={{ width: '28px', height: '28px' }} onClick={() => openEditModal(agent)}>
                            <Edit3 size={14} />
                          </button>
                          {agent.is_active && (
                            <button className="topbar-icon-button" style={{ width: '28px', height: '28px', color: '#EF4444' }} onClick={() => handleDelete(agent.agent_id)}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
              <UserSquare2 size={48} style={{ color: '#9CA3AF', margin: '0 auto 16px', opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1A3C2E', marginBottom: '6px' }}>No agents registered</h3>
              <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Add an agent to your team directory to start assigning properties.</p>
            </div>
          )}
        </div>

        {/* Right Side: Selected Agent Performance Profile */}
        {selectedAgent && (
          <div className="card fade-in" style={{ height: 'fit-content', padding: '24px' }}>
            <div className="card-header-row">
              <h3 className="card-title" style={{ fontSize: '1.125rem' }}>Agent Performance Profile</h3>
              <button className="topbar-icon-button" style={{ width: '24px', height: '24px' }} onClick={() => setSelectedAgent(null)}>
                <X size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '16px 0 24px' }}>
              <Avatar name={`${selectedAgent.first_name} ${selectedAgent.last_name}`} size="lg" />
              <div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1A3C2E' }}>
                  {selectedAgent.first_name} {selectedAgent.last_name}
                </h4>
                <p style={{ color: '#6B7280', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={12} /> {selectedAgent.email}
                </p>
                <p style={{ color: '#6B7280', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <Phone size={12} /> {selectedAgent.phone}
                </p>
              </div>
            </div>

            {/* Performance Stats Toggles */}
            <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', marginBottom: '16px' }}>
              <button 
                style={{
                  flex: 1,
                  padding: '10px 0',
                  border: 'none',
                  background: 'none',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'stats' ? '2.5px solid #1A3C2E' : '2.5px solid transparent',
                  color: activeTab === 'stats' ? '#1A3C2E' : '#9CA3AF'
                }}
                onClick={() => setActiveTab('stats')}
              >
                KPI Statistics
              </button>
              <button 
                style={{
                  flex: 1,
                  padding: '10px 0',
                  border: 'none',
                  background: 'none',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'leads' ? '2.5px solid #1A3C2E' : '2.5px solid transparent',
                  color: activeTab === 'leads' ? '#1A3C2E' : '#9CA3AF'
                }}
                onClick={() => setActiveTab('leads')}
              >
                Leads ({agentLeads.length})
              </button>
              <button 
                style={{
                  flex: 1,
                  padding: '10px 0',
                  border: 'none',
                  background: 'none',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'deals' ? '2.5px solid #1A3C2E' : '2.5px solid transparent',
                  color: activeTab === 'deals' ? '#1A3C2E' : '#9CA3AF'
                }}
                onClick={() => setActiveTab('deals')}
              >
                Deals ({agentDeals.length})
              </button>
            </div>

            {/* Tabs Content */}
            {activeTab === 'stats' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div style={{ backgroundColor: '#F4F6F4', padding: '12px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.6875rem', color: '#6B7280' }}>Active Leads Assigned</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1A3C2E', marginTop: '4px' }}>
                    {selectedAgent.active_leads_count ?? 0}
                  </div>
                </div>
                <div style={{ backgroundColor: '#F4F6F4', padding: '12px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.6875rem', color: '#6B7280' }}>Deals Closed</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1A3C2E', marginTop: '4px' }}>
                    {selectedAgent.closed_deals_count ?? 0}
                  </div>
                </div>
                <div style={{ backgroundColor: '#F4F6F4', padding: '12px', borderRadius: '12px', gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '0.6875rem', color: '#6B7280' }}>Sales Volume</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#1A3C2E', marginTop: '4px' }}>
                    AED {Number(selectedAgent.total_sales_volume ?? 0).toLocaleString()}
                  </div>
                </div>
                <div style={{ backgroundColor: '#E8F5EE', padding: '12px', borderRadius: '12px', gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '0.6875rem', color: '#2D6A4F', fontWeight: 600 }}>Commission Earned</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#1A3C2E', marginTop: '4px' }}>
                    AED {Number(selectedAgent.total_commission_earned ?? 0).toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'leads' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                {agentLeads.length > 0 ? (
                  agentLeads.map((lead) => (
                    <div key={lead.lead_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #F3F4F6' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.75rem' }}>{lead.client ? `${lead.client.first_name} ${lead.client.last_name}` : 'Client'}</div>
                        <div style={{ fontSize: '10px', color: '#6B7280' }}>{lead.property?.title}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className={`badge badge-${lead.status}`} style={{ fontSize: '8px' }}>
                          {lead.status}
                        </span>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#1A3C2E', marginTop: '2px' }}>
                          AED {Number(lead.budget).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#9CA3AF', fontSize: '0.75rem', textAlign: 'center', padding: '16px' }}>No leads assigned to this agent</p>
                )}
              </div>
            )}

            {activeTab === 'deals' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                {agentDeals.length > 0 ? (
                  agentDeals.map((deal) => (
                    <div key={deal.deal_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #F3F4F6' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.75rem' }}>{deal.property?.title || 'Property transaction'}</div>
                        <div style={{ fontSize: '10px', color: '#4CAF82' }}>Comm: AED {Number(deal.commission_amount).toLocaleString()}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="badge badge-available" style={{ fontSize: '8px' }}>{deal.status}</span>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#1A3C2E', marginTop: '2px' }}>
                          AED {Number(deal.final_price).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#9CA3AF', fontSize: '0.75rem', textAlign: 'center', padding: '16px' }}>No deals logged by this agent</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1A3C2E' }}>
                {editingAgent ? 'Edit Agent Profile' : 'Register New Agent'}
              </h3>
              <button className="topbar-icon-button" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={formFirstName}
                      onChange={(e) => setFormFirstName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Last Name *</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={formLastName}
                      onChange={(e) => setFormLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input 
                    type="email" 
                    className="input-field" 
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. +971500000000" 
                    className="input-field" 
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Commission Rate (Decimal) *</label>
                  <input 
                    type="number" 
                    step="0.001" 
                    placeholder="e.g. 0.025" 
                    className="input-field" 
                    value={formCommissionRate}
                    onChange={(e) => setFormCommissionRate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAgent ? 'Save Changes' : 'Register Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
