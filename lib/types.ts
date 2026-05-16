// PropTrack CRM Types - Aligned with Backend

// Enums
export enum PropertyType {
  APARTMENT = 'apartment',
  VILLA = 'villa',
  TOWNHOUSE = 'townhouse',
  OFFICE = 'office',
  RETAIL = 'retail',
  LAND = 'land',
}

export enum PropertyStatus {
  AVAILABLE = 'available',
  UNDER_NEGOTIATION = 'under_negotiation',
  SOLD = 'sold',
  RENTED = 'rented',
  OFF_MARKET = 'off_market',
}

export enum ClientType {
  BUYER = 'buyer',
  SELLER = 'seller',
  RENTER = 'renter',
  LANDLORD = 'landlord',
}

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  VISIT_SCHEDULED = 'visit_scheduled',
  OFFER_MADE = 'offer_made',
  DEAL_CLOSED = 'deal_closed',
  LOST = 'lost',
}

export enum AppointmentType {
  SITE_VISIT = 'site_visit',
  MEETING = 'meeting',
  CALL = 'call',
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum DealStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

export enum ContractType {
  SALE = 'sale',
  RENTAL = 'rental',
  MOU = 'mou',
  LISTING_AGREEMENT = 'listing_agreement',
}

export enum ContractStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  SIGNED = 'signed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum PaymentType {
  FULL = 'full',
  INSTALLMENT = 'installment',
  DEPOSIT = 'deposit',
  COMMISSION = 'commission',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export type UserRole = 'admin' | 'manager' | 'agent';

// API Response Shapes
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Entity Interfaces
export interface User {
  id: number;
  email: string;
  role: UserRole;
  agentId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Agency {
  agency_id: number;
  name: string;
  address?: string;
  phone?: string;
  email: string;
  created_at: string;
  updated_at: string;
  agents?: Agent[];
}

export interface Agent {
  agent_id: number;
  agency_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  commission_rate: number;
  is_active: boolean;
  joined_at?: string;
  created_at: string;
  updated_at: string;
  agency?: Agency;
  // Aliases for frontend convenience
  id?: string;
  firstName?: string;
  lastName?: string;
}

export interface Client {
  client_id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  client_type: ClientType;
  nationality?: string;
  created_at: string;
  updated_at: string;
  // Aliases for frontend convenience
  id?: string;
  firstName?: string;
  lastName?: string;
}

export interface PropertyImage {
  image_id: number;
  property_id: number;
  image_url: string;
  is_primary: boolean;
  created_at: string;
}

export interface Property {
  property_id: number;
  agent_id: number;
  title: string;
  description?: string;
  location: string;
  city: string;
  price: number;
  area_sqft?: number;
  property_type: PropertyType;
  status: PropertyStatus;
  bedrooms?: number;
  bathrooms?: number;
  listed_at?: string;
  created_at: string;
  updated_at: string;
  agent?: Agent;
  images?: PropertyImage[];
}

export interface Tag {
  tag_id: number;
  name: string;
  color: string;
}

export interface Lead {
  lead_id: number;
  client_id: number;
  property_id: number;
  agent_id: number;
  status: LeadStatus;
  notes?: string;
  budget?: number;
  is_stale: boolean;
  inquiry_date: string;
  last_activity: string;
  created_at: string;
  updated_at: string;
  client?: Client;
  property?: Property;
  agent?: Agent;
  tags?: Tag[];
}

export interface Appointment {
  appointment_id: number;
  lead_id: number;
  agent_id: number;
  client_id: number;
  property_id: number;
  scheduled_at: string;
  type: AppointmentType;
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  agent?: Agent;
  client?: Client;
  property?: Property;
}

export interface Contract {
  contract_id: number;
  deal_id: number;
  document_url?: string;
  contract_type: ContractType;
  signed_date?: string;
  expiry_date?: string;
  status: ContractStatus;
  created_at: string;
  updated_at: string;
  deal?: Deal;
}

export interface Payment {
  payment_id: number;
  deal_id: number;
  amount: number;
  payment_type: PaymentType;
  status: PaymentStatus;
  payment_date?: string;
  reference_no?: string;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  deal_id: number;
  lead_id: number;
  property_id: number;
  agent_id: number;
  client_id: number;
  final_price: number;
  commission_amount?: number;
  status: DealStatus;
  deal_date?: string;
  closing_date?: string;
  created_at: string;
  updated_at: string;
  agent?: Agent;
  client?: Client;
  property?: Property;
  contracts?: Contract[];
  payments?: Payment[];
}

// Dashboard Types
export interface DashboardSummary {
  totalProperties: number;
  availableProperties: number;
  soldProperties: number;
  totalLeads: number;
  activeLeads: number;
  totalDeals: number;
  closedDeals: number;
  totalRevenue: number;
  totalAgents: number;
  activeAgents: number;
}

export interface PipelineRow {
  status: LeadStatus;
  count: number;
}

export interface AgentPerformance {
  agent_id: number;
  agent_name: string;
  email: string;
  active_leads: number;
  conversion_rate_pct: number;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}
