import { format, formatDistanceToNow, parseISO } from 'date-fns';
import {
  LeadStatus,
  PropertyStatus,
  DealStatus,
  AppointmentStatus,
  ClientType,
  PropertyType,
  AppointmentType,
} from './types';

// Currency formatting for UAE/Dubai market
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-AE').format(num);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy');
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy h:mm a');
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

// Status labels and badge variants
export const leadStatusConfig: Record<LeadStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  [LeadStatus.NEW]: { label: 'New', variant: 'default' },
  [LeadStatus.CONTACTED]: { label: 'Contacted', variant: 'secondary' },
  [LeadStatus.VISIT_SCHEDULED]: { label: 'Visit Scheduled', variant: 'secondary' },
  [LeadStatus.OFFER_MADE]: { label: 'Offer Made', variant: 'outline' },
  [LeadStatus.DEAL_CLOSED]: { label: 'Deal Closed', variant: 'default' },
  [LeadStatus.LOST]: { label: 'Lost', variant: 'destructive' },
};

export const propertyStatusConfig: Record<PropertyStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  [PropertyStatus.AVAILABLE]: { label: 'Available', variant: 'default' },
  [PropertyStatus.UNDER_NEGOTIATION]: { label: 'Under Negotiation', variant: 'secondary' },
  [PropertyStatus.SOLD]: { label: 'Sold', variant: 'outline' },
  [PropertyStatus.RENTED]: { label: 'Rented', variant: 'outline' },
  [PropertyStatus.OFF_MARKET]: { label: 'Off Market', variant: 'destructive' },
};

export const dealStatusConfig: Record<DealStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  [DealStatus.PENDING]: { label: 'Pending', variant: 'secondary' },
  [DealStatus.ACTIVE]: { label: 'Active', variant: 'default' },
  [DealStatus.CLOSED]: { label: 'Closed', variant: 'outline' },
  [DealStatus.CANCELLED]: { label: 'Cancelled', variant: 'destructive' },
};

export const appointmentStatusConfig: Record<AppointmentStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  [AppointmentStatus.SCHEDULED]: { label: 'Scheduled', variant: 'default' },
  [AppointmentStatus.COMPLETED]: { label: 'Completed', variant: 'outline' },
  [AppointmentStatus.CANCELLED]: { label: 'Cancelled', variant: 'destructive' },
  [AppointmentStatus.NO_SHOW]: { label: 'No Show', variant: 'destructive' },
};

export const clientTypeLabels: Record<ClientType, string> = {
  [ClientType.BUYER]: 'Buyer',
  [ClientType.SELLER]: 'Seller',
  [ClientType.RENTER]: 'Renter',
  [ClientType.LANDLORD]: 'Landlord',
};

export const propertyTypeLabels: Record<PropertyType, string> = {
  [PropertyType.APARTMENT]: 'Apartment',
  [PropertyType.VILLA]: 'Villa',
  [PropertyType.TOWNHOUSE]: 'Townhouse',
  [PropertyType.OFFICE]: 'Office',
  [PropertyType.RETAIL]: 'Retail',
  [PropertyType.LAND]: 'Land',
};

export const appointmentTypeLabels: Record<AppointmentType, string> = {
  [AppointmentType.SITE_VISIT]: 'Site Visit',
  [AppointmentType.MEETING]: 'Meeting',
  [AppointmentType.CALL]: 'Call',
};

// Generate initials from name
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// Full name helper
export function getFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}

// Get status color variant for badge
export function getStatusColor(status: string): string {
  const statusLower = status.toLowerCase().replace(/_/g, ' ');
  
  if (statusLower.includes('closed') || statusLower === 'completed') {
    return 'bg-green-100 text-green-800';
  } else if (statusLower.includes('cancelled') || statusLower === 'lost' || statusLower === 'off market') {
    return 'bg-red-100 text-red-800';
  } else if (statusLower.includes('pending') || statusLower.includes('scheduled')) {
    return 'bg-blue-100 text-blue-800';
  } else if (statusLower.includes('negotiation') || statusLower.includes('offer')) {
    return 'bg-yellow-100 text-yellow-800';
  }
  
  return 'bg-gray-100 text-gray-800';
}
