import React, { useEffect, useState } from 'react';
import { Handshake, Plus, DollarSign, Calendar, ClipboardList, Clock, CheckCircle, XCircle, Trash2, Eye, X } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

interface Deal {
  deal_id: number;
  lead_id: number;
  property_id: number;
  agent_id: number;
  client_id: number;
  status: 'pending' | 'active' | 'closed' | 'cancelled';
  final_price: string;
  commission_rate: string;
  commission_amount: string;
  closing_date: string;
  client?: {
    first_name: string;
    last_name: string;
  };
  property?: {
    title: string;
  };
  agent?: {
    first_name: string;
    last_name: string;
  };
}

interface DealAuditLog {
  log_id: number;
  deal_id: number;
  old_status: string;
  new_status: string;
  changed_by: string;
  changed_at: string;
}

interface Lead {
  lead_id: number;
  budget: string;
  client?: { first_name: string; last_name: string; };
  property?: { title: string; price: string; property_id: number; };
  agent?: { first_name: string; last_name: string; agent_id: number; };
}

export const Deals: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & Logs
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<DealAuditLog[]>([]);
  const [activeDealLogs, setActiveDealLogs] = useState<number | null>(null);

  // Form State
  const [formLeadId, setFormLeadId] = useState('');
  const [formFinalPrice, setFormFinalPrice] = useState('');
  const [formCommissionRate, setFormCommissionRate] = useState('0.03'); // default 3%
  const [formStatus, setFormStatus] = useState<Deal['status']>('pending');
  const [formClosingDate, setFormClosingDate] = useState('');

  const fetchDeals = async () => {
    try {
      const res = await api.get('/deals');
      setDeals(res.data.items || res.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to fetch transaction deals');
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await api.get('/leads');
      // Only allow leads that are NOT deal_closed or lost
      const activeLeads = (res.data.items || res.data || []).filter(
        (l: Lead & { status?: string }) => l.status !== 'deal_closed' && l.status !== 'lost'
      );
      setLeads(activeLeads);
      if (activeLeads.length > 0) {
        setFormLeadId(activeLeads[0].lead_id.toString());
        setFormFinalPrice(activeLeads[0].budget.toString());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchDeals(), fetchLeads()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleLeadChange = (leadIdStr: string) => {
    setFormLeadId(leadIdStr);
    const selected = leads.find(l => l.lead_id.toString() === leadIdStr);
    if (selected) {
      setFormFinalPrice(selected.budget.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLeadId || !formFinalPrice || !formClosingDate) {
      toast.error('Please fill in all fields');
      return;
    }

    const selectedLead = leads.find(l => l.lead_id.toString() === formLeadId);
    if (!selectedLead) return;

    const payload = {
      lead_id: parseInt(formLeadId),
      property_id: selectedLead.property?.property_id,
      agent_id: selectedLead.agent?.agent_id,
      client_id: selectedLead.client ? (selectedLead as any).client_id || 1 : 1, // fallback client relation
      status: formStatus,
      final_price: parseFloat(formFinalPrice),
      commission_rate: parseFloat(formCommissionRate),
      closing_date: new Date(formClosingDate).toISOString()
    };

    try {
      await api.post('/deals', payload);
      toast.success('Deal created successfully');
      setIsModalOpen(false);
      fetchDeals();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create transaction deal');
    }
  };

  const updateDealStatus = async (id: number, newStatus: Deal['status']) => {
    try {
      await api.patch(`/deals/${id}`, { status: newStatus });
      toast.success(`Deal status changed to ${newStatus}`);
      fetchDeals();
      if (activeDealLogs === id) {
        viewAuditLogs(id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update deal status');
    }
  };

  const viewAuditLogs = async (id: number) => {
    try {
      const res = await api.get(`/deals/${id}/audit-log`);
      setAuditLogs(res.data || []);
      setActiveDealLogs(id);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load transaction audit logs');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this deal?')) return;
    try {
      await api.delete(`/deals/${id}`);
      toast.success('Deal deleted successfully');
      fetchDeals();
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete deal');
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#1A3C2E' }}>Transactions & Deals</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Track commissions, closed properties, and trace history logs</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> New Transaction
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div className="sidebar-logo-circle" style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite' }}>
            <Handshake size={18} />
          </div>
          <p style={{ color: '#6B7280' }}>Loading transaction board...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: activeDealLogs ? '2fr 1fr' : '1fr', gap: '20px' }}>
          {/* Main Deal List */}
          <div className="table-wrapper">
            {deals.length > 0 ? (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Client</th>
                    <th>Agent</th>
                    <th>Final Price</th>
                    <th>Commission</th>
                    <th>Closing Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((deal) => (
                    <tr key={deal.deal_id} style={{ backgroundColor: activeDealLogs === deal.deal_id ? '#F4F6F4' : 'transparent' }}>
                      <td style={{ fontWeight: 600 }}>{deal.property ? deal.property.title : 'N/A'}</td>
                      <td>{deal.client ? `${deal.client.first_name} ${deal.client.last_name}` : 'N/A'}</td>
                      <td>{deal.agent ? `${deal.agent.first_name} ${deal.agent.last_name}` : 'N/A'}</td>
                      <td style={{ fontWeight: 700, color: '#1A3C2E' }}>
                        AED {Number(deal.final_price).toLocaleString()}
                      </td>
                      <td style={{ color: '#4CAF82', fontWeight: 600 }}>
                        AED {Number(deal.commission_amount).toLocaleString()} ({Math.round(Number(deal.commission_rate) * 100)}%)
                      </td>
                      <td>{new Date(deal.closing_date).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge badge-${deal.status === 'closed' ? 'available' : deal.status === 'cancelled' ? 'sold' : 'under_negotiation'}`}>
                          {deal.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <button className="topbar-icon-button" style={{ width: '28px', height: '28px' }} onClick={() => viewAuditLogs(deal.deal_id)}>
                            <Eye size={14} />
                          </button>
                          
                          {deal.status !== 'closed' && deal.status !== 'cancelled' && (
                            <>
                              <button 
                                className="topbar-icon-button" 
                                style={{ width: '28px', height: '28px', color: '#10B981' }} 
                                onClick={() => updateDealStatus(deal.deal_id, 'closed')}
                                title="Close Deal"
                              >
                                <CheckCircle size={14} />
                              </button>
                              <button 
                                className="topbar-icon-button" 
                                style={{ width: '28px', height: '28px', color: '#EF4444' }} 
                                onClick={() => updateDealStatus(deal.deal_id, 'cancelled')}
                                title="Cancel Deal"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                          <button 
                            className="topbar-icon-button" 
                            style={{ width: '28px', height: '28px', color: '#EF4444' }}
                            onClick={() => handleDelete(deal.deal_id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <Handshake size={48} style={{ color: '#9CA3AF', margin: '0 auto 16px', opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1A3C2E', marginBottom: '6px' }}>No transactions recorded</h3>
                <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Create a new transaction deal to begin tracking commission.</p>
              </div>
            )}
          </div>

          {/* Audit Logs Sidebar Panel */}
          {activeDealLogs && (
            <div className="card fade-in" style={{ height: 'fit-content' }}>
              <div className="card-header-row">
                <h3 className="card-title" style={{ fontSize: '1rem' }}>Transaction Audit Logs</h3>
                <button className="topbar-icon-button" style={{ width: '24px', height: '24px' }} onClick={() => setActiveDealLogs(null)}>
                  <X size={14} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <div key={log.log_id} style={{ fontSize: '0.75rem', paddingBottom: '10px', borderBottom: '1px solid #F3F4F6' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span style={{ color: '#1A3C2E' }}>
                          Status: {log.old_status} → {log.new_status}
                        </span>
                        <span style={{ color: '#9CA3AF' }}>
                          {new Date(log.changed_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ color: '#6B7280', marginTop: '2px' }}>
                        Modified by: {log.changed_by || 'system_trigger'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#9CA3AF', textAlign: 'center', fontSize: '0.75rem', padding: '16px' }}>
                    No audit logs recorded for this deal
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Deal Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1A3C2E' }}>
                Create Transaction Deal
              </h3>
              <button className="topbar-icon-button" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Lead Pipeline Interest *</label>
                  <select 
                    className="input-field" 
                    value={formLeadId} 
                    onChange={(e) => handleLeadChange(e.target.value)}
                  >
                    {leads.map(l => (
                      <option key={l.lead_id} value={l.lead_id}>
                        {l.client ? `${l.client.first_name} ${l.client.last_name}` : 'Client'} - {l.property ? l.property.title : 'Property'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Final Negotiated Price (AED) *</label>
                  <input 
                    type="number" 
                    className="input-field"
                    value={formFinalPrice}
                    onChange={(e) => setFormFinalPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Commission Rate (Decimal) *</label>
                  <input 
                    type="number" 
                    step="0.001" 
                    className="input-field"
                    value={formCommissionRate}
                    onChange={(e) => setFormCommissionRate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Closing Target Date *</label>
                  <input 
                    type="date" 
                    className="input-field"
                    value={formClosingDate}
                    onChange={(e) => setFormClosingDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Status *</label>
                  <select className="input-field" value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)}>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
