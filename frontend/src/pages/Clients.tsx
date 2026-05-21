import React, { useEffect, useState } from 'react';
import { Users, Plus, Search, Trash2, Edit3, X, Mail, Phone, Globe } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

interface Client {
  client_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  client_type: 'buyer' | 'seller' | 'renter' | 'landlord';
  nationality: string;
}

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form State
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formType, setFormType] = useState<Client['client_type']>('buyer');
  const [formNationality, setFormNationality] = useState('');

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients');
      setClients(res.data.items || res.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load clients list');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchClients();
      setLoading(false);
    };
    init();
  }, []);

  const openAddModal = () => {
    setEditingClient(null);
    setFormFirstName('');
    setFormLastName('');
    setFormEmail('');
    setFormPhone('');
    setFormType('buyer');
    setFormNationality('');
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormFirstName(client.first_name);
    setFormLastName(client.last_name);
    setFormEmail(client.email);
    setFormPhone(client.phone);
    setFormType(client.client_type);
    setFormNationality(client.nationality);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    try {
      await api.delete(`/clients/${id}`);
      toast.success('Client deleted successfully');
      fetchClients();
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete client');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFirstName || !formLastName || !formEmail || !formPhone) {
      toast.error('Please fill in all required fields');
      return;
    }

    const payload = {
      first_name: formFirstName,
      last_name: formLastName,
      email: formEmail,
      phone: formPhone,
      client_type: formType,
      nationality: formNationality || 'General'
    };

    try {
      if (editingClient) {
        await api.patch(`/clients/${editingClient.client_id}`, payload);
        toast.success('Client updated successfully');
      } else {
        await api.post('/clients', payload);
        toast.success('Client created successfully');
      }
      setIsModalOpen(false);
      fetchClients();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save client info');
    }
  };

  const filteredClients = clients.filter((c) => {
    const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase()) || 
                          c.email.toLowerCase().includes(search.toLowerCase()) ||
                          c.phone.includes(search);
    const matchesType = typeFilter === 'all' || c.client_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#1A3C2E' }}>Client Management</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Track buyers, sellers, landlords, and renter contacts</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Add Client
        </button>
      </div>

      {/* Filter and Search */}
      <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flexGrow: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '16px', top: '14px', color: '#9CA3AF' }} />
            <input 
              type="text" 
              placeholder="Search clients by name, email, or phone..." 
              className="input-field"
              style={{ paddingLeft: '44px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select className="input-field" style={{ padding: '8px 36px 8px 12px', fontSize: '12px', width: '150px' }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
            <option value="renter">Renter</option>
            <option value="landlord">Landlord</option>
          </select>
        </div>
      </div>

      {/* Table view */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div className="sidebar-logo-circle" style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite' }}>
            <Users size={18} />
          </div>
          <p style={{ color: '#6B7280' }}>Loading clients index...</p>
        </div>
      ) : filteredClients.length > 0 ? (
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Client Type</th>
                <th>Contact info</th>
                <th>Nationality</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.client_id}>
                  <td style={{ fontWeight: 600 }}>
                    {client.first_name} {client.last_name}
                  </td>
                  <td>
                    <span className={`badge badge-${client.client_type === 'buyer' ? 'available' : client.client_type === 'seller' ? 'sold' : client.client_type === 'renter' ? 'rented' : 'under_negotiation'}`}>
                      {client.client_type}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6B7280' }}>
                        <Mail size={12} /> {client.email}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6B7280' }}>
                        <Phone size={12} /> {client.phone}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Globe size={12} className="text-secondary" /> {client.nationality}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="topbar-icon-button" style={{ width: '28px', height: '28px' }} onClick={() => openEditModal(client)}>
                        <Edit3 size={14} />
                      </button>
                      <button className="topbar-icon-button" style={{ width: '28px', height: '28px', color: '#EF4444' }} onClick={() => handleDelete(client.client_id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <Users size={48} style={{ color: '#9CA3AF', margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1A3C2E', marginBottom: '6px' }}>No clients found</h3>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Create a client contact to begin tracking lead pipeline interest.</p>
        </div>
      )}

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1A3C2E' }}>
                {editingClient ? 'Edit Client Details' : 'Add New Client'}
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
                  <label className="form-label">Client Type *</label>
                  <select className="input-field" value={formType} onChange={(e) => setFormType(e.target.value as any)}>
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                    <option value="renter">Renter</option>
                    <option value="landlord">Landlord</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Nationality</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Emirati" 
                    className="input-field" 
                    value={formNationality}
                    onChange={(e) => setFormNationality(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingClient ? 'Save Changes' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
