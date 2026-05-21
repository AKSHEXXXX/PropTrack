import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Plus, Trash2, X, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

interface Appointment {
  appointment_id: number;
  property_id: number;
  agent_id: number;
  client_id: number;
  scheduled_at: string;
  purpose: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  client?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  property?: {
    title: string;
  };
  agent?: {
    first_name: string;
    last_name: string;
  };
}

interface Client { client_id: number; first_name: string; last_name: string; }
interface Property { property_id: number; title: string; }
interface Agent { agent_id: number; first_name: string; last_name: string; }

export const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formClientId, setFormClientId] = useState('');
  const [formPropertyId, setFormPropertyId] = useState('');
  const [formAgentId, setFormAgentId] = useState('');
  const [formScheduledAt, setFormScheduledAt] = useState('');
  const [formPurpose, setFormPurpose] = useState('');

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data.items || res.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load appointments');
    }
  };

  const fetchMetadata = async () => {
    try {
      const [clientsRes, propsRes, agentsRes] = await Promise.all([
        api.get('/clients'),
        api.get('/properties'),
        api.get('/agents')
      ]);
      setClients(clientsRes.data.items || clientsRes.data || []);
      setProperties(propsRes.data.items || propsRes.data || []);
      setAgents(agentsRes.data || []);

      if (clientsRes.data.length > 0) setFormClientId(clientsRes.data[0].client_id.toString());
      if (propsRes.data.length > 0) setFormPropertyId(propsRes.data[0].property_id.toString());
      if (agentsRes.data.length > 0) setFormAgentId(agentsRes.data[0].agent_id.toString());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchAppointments(), fetchMetadata()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientId || !formPropertyId || !formAgentId || !formScheduledAt || !formPurpose) {
      toast.error('Please fill in all fields');
      return;
    }

    const payload = {
      client_id: parseInt(formClientId),
      property_id: parseInt(formPropertyId),
      agent_id: parseInt(formAgentId),
      scheduled_at: new Date(formScheduledAt).toISOString(),
      purpose: formPurpose,
      status: 'scheduled'
    };

    try {
      await api.post('/appointments', payload);
      toast.success('Appointment scheduled successfully');
      setIsModalOpen(false);
      setFormPurpose('');
      setFormScheduledAt('');
      fetchAppointments();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to schedule appointment');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;
    try {
      await api.delete(`/appointments/${id}`);
      toast.success('Appointment cancelled / deleted');
      fetchAppointments();
    } catch (e) {
      console.error(e);
      toast.error('Failed to cancel appointment');
    }
  };

  const updateStatus = async (id: number, status: Appointment['status']) => {
    try {
      await api.patch(`/appointments/${id}`, { status });
      toast.success(`Appointment status updated to ${status}`);
      fetchAppointments();
    } catch (e) {
      console.error(e);
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#1A3C2E' }}>Appointments Calendar</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Schedule and manage viewings, consultations and client meetings</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Schedule viewing
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div className="sidebar-logo-circle" style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite' }}>
            <Calendar size={18} />
          </div>
          <p style={{ color: '#6B7280' }}>Loading appointments scheduler...</p>
        </div>
      ) : appointments.length > 0 ? (
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Scheduled At</th>
                <th>Purpose</th>
                <th>Client</th>
                <th>Property Interest</th>
                <th>Assigned Agent</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr key={appt.appointment_id}>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={14} className="text-secondary" />
                      <span>
                        {new Date(appt.scheduled_at).toLocaleDateString()} at {new Date(appt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td>{appt.purpose}</td>
                  <td>
                    {appt.client ? `${appt.client.first_name} ${appt.client.last_name}` : 'Unknown Client'}
                  </td>
                  <td>{appt.property ? appt.property.title : 'General Consultation'}</td>
                  <td>{appt.agent ? `${appt.agent.first_name} ${appt.agent.last_name}` : 'Unassigned'}</td>
                  <td>
                    <span className={`badge badge-${appt.status === 'scheduled' ? 'visit_scheduled' : appt.status === 'completed' ? 'available' : 'sold'}`}>
                      {appt.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {appt.status === 'scheduled' && (
                        <>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '10px' }}
                            onClick={() => updateStatus(appt.appointment_id, 'completed')}
                          >
                            Complete
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '4px 8px', fontSize: '10px' }}
                            onClick={() => updateStatus(appt.appointment_id, 'cancelled')}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      <button 
                        className="topbar-icon-button" 
                        style={{ width: '28px', height: '28px', color: '#EF4444' }}
                        onClick={() => handleDelete(appt.appointment_id)}
                      >
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
          <Calendar size={48} style={{ color: '#9CA3AF', margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1A3C2E', marginBottom: '6px' }}>No appointments scheduled</h3>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Create a schedule for client property viewings.</p>
        </div>
      )}

      {/* Scheduler Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1A3C2E' }}>
                Schedule Client Viewing
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
                        {c.first_name} {c.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Property *</label>
                  <select className="input-field" value={formPropertyId} onChange={(e) => setFormPropertyId(e.target.value)}>
                    {properties.map(p => (
                      <option key={p.property_id} value={p.property_id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Viewing Agent *</label>
                  <select className="input-field" value={formAgentId} onChange={(e) => setFormAgentId(e.target.value)}>
                    {agents.map(a => (
                      <option key={a.agent_id} value={a.agent_id}>
                        {a.first_name} {a.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Date & Time *</label>
                  <input 
                    type="datetime-local" 
                    className="input-field"
                    value={formScheduledAt}
                    onChange={(e) => setFormScheduledAt(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Purpose / Meeting Note *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. First property viewing and tour" 
                    className="input-field"
                    value={formPurpose}
                    onChange={(e) => setFormPurpose(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
