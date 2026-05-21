import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  MapPin, 
  BedDouble, 
  Bath, 
  Maximize, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  X,
  Building
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

interface Property {
  property_id: number;
  title: string;
  location: string;
  city: string;
  price: string;
  area_sqft: number;
  property_type: 'apartment' | 'villa' | 'townhouse' | 'penthouse' | 'office' | 'retail' | 'land';
  bedrooms: number;
  bathrooms: number;
  status: 'available' | 'sold' | 'rented' | 'under_negotiation' | 'off_market';
  agent_id: number;
  agent?: {
    first_name: string;
    last_name: string;
  };
  images?: { image_url: string }[];
  description?: string;
}

interface Agent {
  agent_id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export const Properties: React.FC = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [viewingProperty, setViewingProperty] = useState<Property | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formCity, setFormCity] = useState('Dubai');
  const [formPrice, setFormPrice] = useState('');
  const [formArea, setFormArea] = useState('');
  const [formType, setFormType] = useState<Property['property_type']>('apartment');
  const [formBedrooms, setFormBedrooms] = useState('2');
  const [formBathrooms, setFormBathrooms] = useState('2');
  const [formStatus, setFormStatus] = useState<Property['status']>('available');
  const [formAgentId, setFormAgentId] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const fetchProperties = async () => {
    try {
      const res = await api.get('/properties');
      setProperties(res.data.items || res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load properties');
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await api.get('/agents');
      const agentList = res.data.items || res.data || [];
      setAgents(agentList);
      if (agentList.length > 0 && !formAgentId) {
        setFormAgentId(agentList[0].agent_id.toString());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchProperties(), fetchAgents()]);
      setLoading(false);
    };
    init();
  }, []);

  const openAddModal = () => {
    setEditingProperty(null);
    setFormTitle('');
    setFormLocation('');
    setFormCity('Dubai');
    setFormPrice('');
    setFormArea('');
    setFormType('apartment');
    setFormBedrooms('2');
    setFormBathrooms('2');
    setFormStatus('available');
    setFormDescription('');
    if (agents.length > 0) {
      setFormAgentId(agents[0].agent_id.toString());
    }
    setIsModalOpen(true);
  };

  const openEditModal = (property: Property) => {
    setEditingProperty(property);
    setFormTitle(property.title);
    setFormLocation(property.location);
    setFormCity(property.city);
    setFormPrice(property.price.toString());
    setFormArea(property.area_sqft.toString());
    setFormType(property.property_type);
    setFormBedrooms(property.bedrooms.toString());
    setFormBathrooms(property.bathrooms.toString());
    setFormStatus(property.status);
    setFormAgentId(property.agent_id.toString());
    setFormDescription(property.description || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    try {
      await api.delete(`/properties/${id}`);
      toast.success('Property deleted successfully');
      fetchProperties();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete property');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formLocation || !formPrice || !formArea || !formAgentId) {
      toast.error('Please fill in all required fields');
      return;
    }

    const payload = {
      title: formTitle,
      location: formLocation,
      city: formCity,
      price: parseFloat(formPrice),
      areaSqft: parseInt(formArea),
      propertyType: formType,
      bedrooms: parseInt(formBedrooms),
      bathrooms: parseInt(formBathrooms),
      status: formStatus,
      agentId: parseInt(formAgentId),
      description: formDescription,
    };

    try {
      if (editingProperty) {
        await api.patch(`/properties/${editingProperty.property_id}`, payload);
        toast.success('Property updated successfully');
      } else {
        await api.post('/properties', payload);
        toast.success('Property added successfully');
      }
      setIsModalOpen(false);
      fetchProperties();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save property');
    }
  };

  // Filter logic
  const filteredProperties = properties.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          p.location.toLowerCase().includes(search.toLowerCase()) ||
                          p.city.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesType = typeFilter === 'all' || p.property_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="page-container">
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#1A3C2E' }}>Properties Portfolio</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Manage your agency's premium property portfolio listings</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Add Property
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ flexGrow: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '16px', top: '14px', color: '#9CA3AF' }} />
            <input 
              type="text" 
              placeholder="Search by title, location, city..." 
              className="input-field"
              style={{ paddingLeft: '44px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} className="text-secondary" />
              <select className="input-field" style={{ padding: '8px 36px 8px 12px', fontSize: '12px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="sold">Sold</option>
                <option value="rented">Rented</option>
                <option value="under_negotiation">Under Negotiation</option>
                <option value="off_market">Off Market</option>
              </select>
            </div>

            <select className="input-field" style={{ padding: '8px 36px 8px 12px', fontSize: '12px' }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="apartment">Apartment</option>
              <option value="villa">Villa</option>
              <option value="townhouse">Townhouse</option>
              <option value="penthouse">Penthouse</option>
              <option value="office">Office</option>
              <option value="retail">Retail</option>
              <option value="land">Land Plot</option>
            </select>
          </div>
        </div>
      </div>

      {/* Properties list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div className="sidebar-logo-circle" style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite' }}>
            <Building size={18} />
          </div>
          <p style={{ color: '#6B7280' }}>Loading properties portfolio...</p>
        </div>
      ) : filteredProperties.length > 0 ? (
        <div className="properties-grid">
          {filteredProperties.map((property) => (
            <div 
              key={property.property_id} 
              className="card interactive" 
              style={{ padding: '12px', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
              onClick={() => setViewingProperty(property)}
            >
              <div className="property-card-img-wrapper">
                {property.images && property.images.length > 0 ? (
                  <img src={property.images[0].image_url} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div className="property-placeholder-gradient">
                    <Building2 size={36} style={{ opacity: 0.8 }} />
                  </div>
                )}
                <div className="property-card-badge">
                  <span className={`badge badge-${property.status}`}>
                    {property.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '12px', flexGrow: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#4CAF82', fontWeight: 700 }}>
                    {property.property_type}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="topbar-icon-button" style={{ width: '28px', height: '28px' }} onClick={(e) => { e.stopPropagation(); openEditModal(property); }}>
                      <Edit3 size={14} />
                    </button>
                    <button className="topbar-icon-button" style={{ width: '28px', height: '28px', color: '#EF4444' }} onClick={(e) => { e.stopPropagation(); handleDelete(property.property_id); }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1A3C2E', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {property.title}
                </h4>

                <p style={{ fontSize: '0.75rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <MapPin size={12} /> {property.location}, {property.city}
                </p>
                {property.description && (
                  <p style={{ fontSize: '0.75rem', color: '#4B5563', marginTop: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    <strong>About:</strong> {property.description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {property.status === 'available' ? (
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#E0E7FF', color: '#4338CA', fontWeight: 600 }}>{Number(property.price) < 500000 ? 'For Rent' : 'For Sale'}</span>
                  ) : property.status === 'rented' ? (
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#FEF3C7', color: '#D97706', fontWeight: 600 }}>Rented</span>
                  ) : (
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#F3F4F6', color: '#4B5563', fontWeight: 600 }}>{property.status.replace('_', ' ')}</span>
                  )}
                  {property.property_id % 3 === 0 && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#FEF2F2', color: '#EF4444', fontWeight: 600 }}>Hot Lead</span>}
                  {property.property_id % 4 === 0 && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#F5F3FF', color: '#8B5CF6', fontWeight: 600 }}>VIP</span>}
                  {property.property_id % 5 === 0 && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#FFF7ED', color: '#F97316', fontWeight: 600 }}>Price Drop</span>}
                  {Number(property.price) > 3000000 && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#FCE7F3', color: '#BE185D', fontWeight: 600 }}>Premium</span>}
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#E0F2FE', color: '#0369A1', fontWeight: 600 }}>{property.property_type}</span>
                </div>

                <div className="property-specs">
                  <div className="property-spec-item">
                    <BedDouble size={14} /> <span>{property.bedrooms} Bed</span>
                  </div>
                  <div className="property-spec-item">
                    <Bath size={14} /> <span>{property.bathrooms} Bath</span>
                  </div>
                  <div className="property-spec-item">
                    <Maximize size={14} /> <span>{property.area_sqft} sqft</span>
                  </div>
                </div>

                <div className="property-agent-footer">
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1A3C2E' }}>
                    AED {Number(property.price).toLocaleString()}
                  </div>
                  {property.agent && (
                    <span style={{ fontSize: '10px', color: '#6B7280', fontStyle: 'italic' }}>
                      Agent: {property.agent.first_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <Building2 size={48} style={{ color: '#9CA3AF', margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1A3C2E', marginBottom: '6px' }}>No properties found</h3>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Try clearing filters or add a new property listing.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1A3C2E' }}>
                {editingProperty ? 'Edit Property Listing' : 'Add New Property'}
              </h3>
              <button className="topbar-icon-button" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Property Title *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Luxury Penthouse Marina" 
                    className="input-field" 
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">About / Overview (Buy or Rent) *</label>
                  <textarea 
                    placeholder="e.g. A stunning luxury property for sale..." 
                    className="input-field" 
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                    style={{ resize: 'vertical' }}
                    required
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Address Location *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Sheikh Zayed Road" 
                    className="input-field" 
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Price (AED) *</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 1500000" 
                    className="input-field" 
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Area (sqft) *</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 1200" 
                    className="input-field" 
                    value={formArea}
                    onChange={(e) => setFormArea(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Property Type *</label>
                  <select className="input-field" value={formType} onChange={(e) => setFormType(e.target.value as any)}>
                    <option value="apartment">Apartment</option>
                    <option value="villa">Villa</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="penthouse">Penthouse</option>
                    <option value="office">Office</option>
                    <option value="retail">Retail</option>
                    <option value="land">Land Plot</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Bedrooms *</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={formBedrooms}
                    onChange={(e) => setFormBedrooms(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Bathrooms *</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={formBathrooms}
                    onChange={(e) => setFormBathrooms(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Listing Status *</label>
                  <select className="input-field" value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)}>
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
                    <option value="rented">Rented</option>
                    <option value="under_negotiation">Under Negotiation</option>
                    <option value="off_market">Off Market</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Agent *</label>
                  <select className="input-field" value={formAgentId} onChange={(e) => setFormAgentId(e.target.value)}>
                    {agents.map((ag) => (
                      <option key={ag.agent_id} value={ag.agent_id}>
                        {ag.first_name} {ag.last_name} ({ag.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProperty ? 'Save Changes' : 'Create Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingProperty && (
        <div className="modal-overlay" onClick={() => setViewingProperty(null)}>
          <div className="modal-content" style={{ maxWidth: '800px', padding: 0, overflow: 'hidden', display: 'flex', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            {/* Left side: Image */}
            <div style={{ flex: '1', minHeight: '400px', backgroundColor: '#F3F4F6', position: 'relative' }}>
              {viewingProperty.images && viewingProperty.images.length > 0 ? (
                <img src={viewingProperty.images[0].image_url} alt={viewingProperty.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div className="property-placeholder-gradient" style={{ height: '100%' }}>
                  <Building2 size={64} style={{ opacity: 0.8 }} />
                </div>
              )}
              <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
                <span className={`badge badge-${viewingProperty.status}`} style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  {viewingProperty.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            
            {/* Right side: Details */}
            <div style={{ flex: '1', padding: '32px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#4CAF82', fontWeight: 700, letterSpacing: '0.05em' }}>
                    {viewingProperty.property_type}
                  </span>
                  {viewingProperty.property_id % 3 === 0 && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#FEF2F2', color: '#EF4444', fontWeight: 600 }}>Hot Lead</span>}
                  {viewingProperty.property_id % 4 === 0 && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#F5F3FF', color: '#8B5CF6', fontWeight: 600 }}>VIP</span>}
                  {viewingProperty.property_id % 5 === 0 && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#FFF7ED', color: '#F97316', fontWeight: 600 }}>Price Drop</span>}
                  {Number(viewingProperty.price) > 3000000 && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#FCE7F3', color: '#BE185D', fontWeight: 600 }}>Premium</span>}
                </div>
                <button className="topbar-icon-button" onClick={() => setViewingProperty(null)}>
                  <X size={20} />
                </button>
              </div>
              
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1A3C2E', marginTop: '8px', marginBottom: '8px' }}>
                {viewingProperty.title}
              </h2>
              
              <p style={{ fontSize: '0.875rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
                <MapPin size={16} /> {viewingProperty.location}, {viewingProperty.city}
              </p>
              
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1A3C2E', marginBottom: '24px' }}>
                AED {Number(viewingProperty.price).toLocaleString()}
                <span style={{ fontSize: '0.875rem', color: '#6B7280', fontWeight: 400, marginLeft: '8px' }}>
                  {Number(viewingProperty.price) < 500000 ? '/ year' : ''}
                </span>
              </div>
              
              <div className="property-specs" style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                <div className="property-spec-item">
                  <BedDouble size={18} /> <span>{viewingProperty.bedrooms} Bed</span>
                </div>
                <div className="property-spec-item">
                  <Bath size={18} /> <span>{viewingProperty.bathrooms} Bath</span>
                </div>
                <div className="property-spec-item">
                  <Maximize size={18} /> <span>{viewingProperty.area_sqft} sqft</span>
                </div>
              </div>
              
              {viewingProperty.description && (
                <div style={{ flexGrow: 1, marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#1A3C2E', marginBottom: '8px' }}>About This Property</h4>
                  <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {viewingProperty.description}
                  </p>
                </div>
              )}
              
              {viewingProperty.agent && (
                <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#E0E7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338CA', fontWeight: 600, fontSize: '1.125rem' }}>
                    {viewingProperty.agent.first_name[0]}{viewingProperty.agent.last_name[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1A3C2E' }}>
                      {viewingProperty.agent.first_name} {viewingProperty.agent.last_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Listing Agent</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
