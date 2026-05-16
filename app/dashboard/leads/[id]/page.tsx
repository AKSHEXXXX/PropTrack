'use client'

import { use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Edit, User, Home, DollarSign, Calendar, Clock, Tag as TagIcon } from 'lucide-react'
import { formatCurrency, formatDate, formatRelativeTime, leadStatusConfig, getFullName, clientTypeLabels } from '@/lib/format'
import { LeadStatus, ClientType, PropertyType, PropertyStatus } from '@/lib/types'
import type { Lead, Appointment } from '@/lib/types'

// Demo lead for fallback
const demoLead: Lead = {
  lead_id: 1,
  client_id: 1,
  property_id: 1,
  agent_id: 1,
  status: LeadStatus.CONTACTED,
  notes: 'Client very interested in marina views. Has visited twice. Budget is flexible for the right property. Prefers high floors.',
  budget: 3500000,
  is_stale: false,
  inquiry_date: '2024-01-15',
  last_activity: '2024-01-20',
  created_at: '2024-01-15',
  updated_at: '2024-01-20',
  client: { client_id: 1, first_name: 'Mohammed', last_name: 'Al Rashid', email: 'mohammed@email.com', phone: '+971 50 123 4567', client_type: ClientType.BUYER, nationality: 'UAE', created_at: '', updated_at: '' },
  property: { property_id: 1, agent_id: 1, title: 'Luxury Marina Apartment', description: 'Stunning 3BR', location: 'Dubai Marina, Tower A', city: 'Dubai', price: 3500000, area_sqft: 2200, property_type: PropertyType.APARTMENT, status: PropertyStatus.AVAILABLE, bedrooms: 3, bathrooms: 3, created_at: '', updated_at: '' },
  agent: { agent_id: 1, agency_id: 1, first_name: 'Sarah', last_name: 'Johnson', email: 'sarah@proptrack.com', phone: '+971 50 987 6543', commission_rate: 0.025, is_active: true, created_at: '', updated_at: '' },
  tags: [
    { tag_id: 1, name: 'VIP', color: '#3B82F6' },
    { tag_id: 2, name: 'Urgent', color: '#EF4444' },
  ],
} as any

const demoAppointments: Appointment[] = [
  {
    appointment_id: 1,
    lead_id: 1,
    agent_id: 1,
    client_id: 1,
    property_id: 1,
    scheduled_at: '2024-01-22T14:00:00Z',
    type: 'site_visit' as any,
    status: 'scheduled' as any,
    notes: 'Second viewing',
    created_at: '',
    updated_at: '',
  } as any,
] as any

const fetcher = async (url: string) => {
  const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1]
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error('Failed to fetch')
  const data = await res.json()
  return data.data || data
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const { data: lead, isLoading } = useSWR<Lead>(
    `${API_URL}/leads/${id}`,
    fetcher,
    { fallbackData: { ...demoLead, lead_id: parseInt(id) }, revalidateOnFocus: false }
  )

  const { data: appointments } = useSWR<Appointment[]>(
    `${API_URL}/appointments?lead_id=${id}`,
    fetcher,
    { fallbackData: demoAppointments, revalidateOnFocus: false }
  )

  const statusConfig = lead ? leadStatusConfig[lead.status] : leadStatusConfig[LeadStatus.NEW]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            {isLoading ? (
              <>
                <Skeleton className="mb-2 h-7 w-48" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {lead?.client ? getFullName(lead.client.first_name, lead.client.last_name) : 'Lead Details'}
                </h1>
                <p className="text-muted-foreground">
                  {lead?.property?.title || 'No property assigned'}
                </p>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isLoading && <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>}
          <Button variant="outline" asChild>
            <Link href={`/dashboard/leads/${id}/edit`}>
              <Edit data-icon="inline-start" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Lead Info */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-5 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <DollarSign className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="font-medium">{lead?.budget ? formatCurrency(lead.budget) : 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Inquiry Date</p>
                      <p className="font-medium">{lead?.inquiry_date ? formatDate(lead.inquiry_date) : '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Last Activity</p>
                      <p className="font-medium">{lead?.last_activity ? formatRelativeTime(lead.last_activity) : '-'}</p>
                    </div>
                  </div>
                  {lead?.tags && lead.tags.length > 0 && (
                    <div className="flex items-center gap-3">
                      <TagIcon className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Tags</p>
                        <div className="flex flex-wrap gap-1">
                          {lead.tags.map((tag) => (
                            <Badge key={tag.tag_id} variant="outline">
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {lead?.notes && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="mb-2 text-sm font-medium">Notes</p>
                    <p className="text-sm text-muted-foreground">{lead.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Appointments */}
          <Card>
            <CardHeader>
              <CardTitle>Appointment History</CardTitle>
              <CardDescription>All appointments for this lead</CardDescription>
            </CardHeader>
            <CardContent>
              {appointments && appointments.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {appointments.map((apt) => (
                    <div key={apt.appointment_id} className="flex items-start gap-4 rounded-lg border p-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                        <Calendar className="size-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium capitalize">{apt.type.replace('_', ' ')}</p>
                          <Badge variant={apt.status === 'completed' ? 'outline' : 'default'}>
                            {apt.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(apt.scheduled_at)}
                        </p>
                        {apt.notes && (
                          <p className="mt-1 text-sm text-muted-foreground">{apt.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-muted-foreground">No appointments yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : lead?.client ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-secondary">
                      <User className="size-5" />
                    </div>
                    <div>
                      <p className="font-medium">{getFullName(lead.client.first_name, lead.client.last_name)}</p>
                      <Badge variant="outline" className="mt-1">
                        {clientTypeLabels[lead.client.client_type]}
                      </Badge>
                    </div>
                  </div>
                  {lead.client.email && (
                    <p className="text-sm text-muted-foreground">{lead.client.email}</p>
                  )}
                  {lead.client.phone && (
                    <p className="text-sm text-muted-foreground">{lead.client.phone}</p>
                  )}
                  <Button variant="outline" size="sm" asChild className="mt-2">
                    <Link href={`/dashboard/clients/${lead.client.client_id}`}>
                      View Client
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">No client assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Property Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Property</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : lead?.property ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-secondary">
                      <Home className="size-5" />
                    </div>
                    <div>
                      <p className="font-medium">{lead.property.title}</p>
                      <p className="text-sm text-muted-foreground">{lead.property.location}</p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold">{formatCurrency(lead.property.price)}</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/properties/${lead.property.property_id}`}>
                      View Property
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">No property assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Agent Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assigned Agent</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : lead?.agent ? (
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-secondary">
                    <User className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium">{getFullName(lead.agent.first_name, lead.agent.last_name)}</p>
                    <p className="text-sm text-muted-foreground">{lead.agent.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No agent assigned</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
