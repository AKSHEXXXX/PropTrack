'use client'

import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, User, Home, DollarSign } from 'lucide-react'
import { formatCurrency, leadStatusConfig, getFullName } from '@/lib/format'
import { LeadStatus } from '@/lib/types'
import type { Lead, PaginatedResponse } from '@/lib/types'

// Demo data
const demoLeads: Lead[] = [
  {
    lead_id: 1,
    client_id: 1,
    property_id: 1,
    agent_id: 1,
    status: LeadStatus.NEW,
    notes: 'Interested in marina views',
    budget: 3500000,
    is_stale: false,
    inquiry_date: '2024-01-20',
    last_activity: '2024-01-20',
    created_at: '2024-01-20',
    updated_at: '2024-01-20',
    client: { client_id: 1, first_name: 'Mohammed', last_name: 'Al Rashid', email: 'mohammed@email.com', phone: '+971501234567', client_type: 'buyer' as const, created_at: '', updated_at: '' },
    property: { property_id: 1, agent_id: 1, title: 'Luxury Marina Apartment', location: 'Dubai Marina', city: 'Dubai', price: 3500000, property_type: 'apartment' as const, status: 'available' as const, created_at: '', updated_at: '' },
    agent: { agent_id: 1, agency_id: 1, first_name: 'Sarah', last_name: 'Johnson', email: 'sarah@proptrack.com', commission_rate: 0.025, is_active: true, created_at: '', updated_at: '' },
  },
  {
    lead_id: 2,
    client_id: 2,
    property_id: 2,
    agent_id: 2,
    status: LeadStatus.CONTACTED,
    notes: 'Following up on Palm villa',
    budget: 15000000,
    is_stale: false,
    inquiry_date: '2024-01-18',
    last_activity: '2024-01-19',
    created_at: '2024-01-18',
    updated_at: '2024-01-19',
    client: { client_id: 2, first_name: 'Sarah', last_name: 'Williams', email: 'sarah.w@email.com', phone: '+971507654321', client_type: 'buyer' as const, created_at: '', updated_at: '' },
    property: { property_id: 2, agent_id: 2, title: 'Palm Jumeirah Villa', location: 'Palm Jumeirah', city: 'Dubai', price: 15000000, property_type: 'villa' as const, status: 'under_negotiation' as const, created_at: '', updated_at: '' },
    agent: { agent_id: 2, agency_id: 1, first_name: 'Ahmed', last_name: 'Hassan', email: 'ahmed@proptrack.com', commission_rate: 0.025, is_active: true, created_at: '', updated_at: '' },
  },
  {
    lead_id: 3,
    client_id: 3,
    property_id: 3,
    agent_id: 1,
    status: LeadStatus.VISIT_SCHEDULED,
    notes: 'Scheduled for Thursday 2pm',
    budget: 8000000,
    is_stale: false,
    inquiry_date: '2024-01-15',
    last_activity: '2024-01-20',
    created_at: '2024-01-15',
    updated_at: '2024-01-20',
    client: { client_id: 3, first_name: 'James', last_name: 'Chen', email: 'james@email.com', phone: '+971509876543', client_type: 'buyer' as const, created_at: '', updated_at: '' },
    property: { property_id: 3, agent_id: 1, title: 'Downtown Office Space', location: 'DIFC', city: 'Dubai', price: 8500000, property_type: 'office' as const, status: 'available' as const, created_at: '', updated_at: '' },
    agent: { agent_id: 1, agency_id: 1, first_name: 'Sarah', last_name: 'Johnson', email: 'sarah@proptrack.com', commission_rate: 0.025, is_active: true, created_at: '', updated_at: '' },
  },
  {
    lead_id: 4,
    client_id: 4,
    property_id: 5,
    agent_id: 2,
    status: LeadStatus.OFFER_MADE,
    notes: 'Offer at 2.6M, waiting for response',
    budget: 2800000,
    is_stale: false,
    inquiry_date: '2024-01-10',
    last_activity: '2024-01-18',
    created_at: '2024-01-10',
    updated_at: '2024-01-18',
    client: { client_id: 4, first_name: 'Fatima', last_name: 'Ahmad', email: 'fatima@email.com', phone: '+971501112233', client_type: 'buyer' as const, created_at: '', updated_at: '' },
    property: { property_id: 5, agent_id: 2, title: 'Arabian Ranches Townhouse', location: 'Arabian Ranches 2', city: 'Dubai', price: 2800000, property_type: 'townhouse' as const, status: 'available' as const, created_at: '', updated_at: '' },
    agent: { agent_id: 2, agency_id: 1, first_name: 'Ahmed', last_name: 'Hassan', email: 'ahmed@proptrack.com', commission_rate: 0.025, is_active: true, created_at: '', updated_at: '' },
  },
  {
    lead_id: 5,
    client_id: 5,
    property_id: 4,
    agent_id: 3,
    status: LeadStatus.DEAL_CLOSED,
    notes: 'Sold at asking price',
    budget: 950000,
    is_stale: false,
    inquiry_date: '2024-01-05',
    last_activity: '2024-01-20',
    created_at: '2024-01-05',
    updated_at: '2024-01-20',
    client: { client_id: 5, first_name: 'Alex', last_name: 'Petrov', email: 'alex@email.com', phone: '+971503334455', client_type: 'buyer' as const, created_at: '', updated_at: '' },
    property: { property_id: 4, agent_id: 3, title: 'JBR Beachfront Studio', location: 'JBR', city: 'Dubai', price: 950000, property_type: 'apartment' as const, status: 'sold' as const, created_at: '', updated_at: '' },
    agent: { agent_id: 3, agency_id: 1, first_name: 'Maria', last_name: 'Garcia', email: 'maria@proptrack.com', commission_rate: 0.025, is_active: true, created_at: '', updated_at: '' },
  },
  {
    lead_id: 6,
    client_id: 6,
    property_id: 1,
    agent_id: 1,
    status: LeadStatus.LOST,
    notes: 'Found cheaper option elsewhere',
    budget: 3000000,
    is_stale: false,
    inquiry_date: '2024-01-08',
    last_activity: '2024-01-15',
    created_at: '2024-01-08',
    updated_at: '2024-01-15',
    client: { client_id: 6, first_name: 'David', last_name: 'Kim', email: 'david@email.com', phone: '+971506667788', client_type: 'buyer' as const, created_at: '', updated_at: '' },
    property: { property_id: 1, agent_id: 1, title: 'Luxury Marina Apartment', location: 'Dubai Marina', city: 'Dubai', price: 3500000, property_type: 'apartment' as const, status: 'available' as const, created_at: '', updated_at: '' },
    agent: { agent_id: 1, agency_id: 1, first_name: 'Sarah', last_name: 'Johnson', email: 'sarah@proptrack.com', commission_rate: 0.025, is_active: true, created_at: '', updated_at: '' },
  },
  {
    lead_id: 7,
    client_id: 7,
    property_id: 2,
    agent_id: 2,
    status: LeadStatus.NEW,
    notes: 'VIP client referral',
    budget: 20000000,
    is_stale: false,
    inquiry_date: '2024-01-21',
    last_activity: '2024-01-21',
    created_at: '2024-01-21',
    updated_at: '2024-01-21',
    client: { client_id: 7, first_name: 'Omar', last_name: 'Khalid', email: 'omar@email.com', phone: '+971509998877', client_type: 'buyer' as const, created_at: '', updated_at: '' },
    property: { property_id: 2, agent_id: 2, title: 'Palm Jumeirah Villa', location: 'Palm Jumeirah', city: 'Dubai', price: 15000000, property_type: 'villa' as const, status: 'under_negotiation' as const, created_at: '', updated_at: '' },
    agent: { agent_id: 2, agency_id: 1, first_name: 'Ahmed', last_name: 'Hassan', email: 'ahmed@proptrack.com', commission_rate: 0.025, is_active: true, created_at: '', updated_at: '' },
  },
]

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

const statusOrder = [
  LeadStatus.NEW,
  LeadStatus.CONTACTED,
  LeadStatus.VISIT_SCHEDULED,
  LeadStatus.OFFER_MADE,
  LeadStatus.DEAL_CLOSED,
  LeadStatus.LOST,
]

export default function LeadsPage() {
  const [agentFilter, setAgentFilter] = useState<string>('all')

  const { data, isLoading } = useSWR<PaginatedResponse<Lead> | Lead[]>(
    `${API_URL}/leads`,
    fetcher,
    { fallbackData: demoLeads, revalidateOnFocus: false }
  )

  const leads = Array.isArray(data) ? data : data?.items || demoLeads

  // Get unique agents
  const agents = leads.reduce((acc, lead) => {
    if (lead.agent && !acc.find(a => a.agent_id === lead.agent!.agent_id)) {
      acc.push(lead.agent)
    }
    return acc
  }, [] as NonNullable<Lead['agent']>[])

  // Apply filter
  const filteredLeads = agentFilter === 'all' 
    ? leads 
    : leads.filter(lead => lead.agent_id.toString() === agentFilter)

  // Group by status
  const leadsByStatus = statusOrder.reduce((acc, status) => {
    acc[status] = filteredLeads.filter(lead => lead.status === status)
    return acc
  }, {} as Record<LeadStatus, Lead[]>)

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Lead Pipeline</h1>
          <p className="text-muted-foreground">Track and manage your leads</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.agent_id} value={agent.agent_id.toString()}>
                  {getFullName(agent.first_name, agent.last_name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild>
            <Link href="/dashboard/leads/new">
              <Plus data-icon="inline-start" />
              Add Lead
            </Link>
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-6">
          {statusOrder.map((status) => (
            <Card key={status} className="flex flex-col">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-6">
          {statusOrder.map((status) => {
            const config = leadStatusConfig[status]
            const statusLeads = leadsByStatus[status]
            return (
              <Card key={status} className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm font-medium">
                    <Badge variant={config.variant}>{config.label}</Badge>
                    <span className="text-muted-foreground">{statusLeads.length}</span>
                  </CardTitle>
                </CardHeader>
                <ScrollArea className="flex-1">
                  <CardContent className="flex flex-col gap-3 pt-0">
                    {statusLeads.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">No leads</p>
                    ) : (
                      statusLeads.map((lead) => (
                        <LeadCard key={lead.lead_id} lead={lead} />
                      ))
                    )}
                  </CardContent>
                </ScrollArea>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function LeadCard({ lead }: { lead: Lead }) {
  return (
    <Link href={`/dashboard/leads/${lead.lead_id}`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardContent className="p-3">
          <div className="mb-2 flex items-center gap-2">
            <User className="size-3 text-muted-foreground" />
            <span className="truncate text-sm font-medium">
              {lead.client ? getFullName(lead.client.first_name, lead.client.last_name) : 'Unknown Client'}
            </span>
          </div>
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Home className="size-3" />
            <span className="truncate">{lead.property?.title || 'No property'}</span>
          </div>
          {lead.budget && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <DollarSign className="size-3" />
              <span>{formatCurrency(lead.budget)}</span>
            </div>
          )}
          {lead.tags && lead.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {lead.tags.slice(0, 2).map((tag) => (
                <Badge key={tag.tag_id} variant="outline" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
