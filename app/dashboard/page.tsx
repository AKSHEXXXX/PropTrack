'use client'

import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Building2, Users, TrendingUp, Handshake, DollarSign, UserCheck } from 'lucide-react'
import { formatCurrency, formatNumber, leadStatusConfig } from '@/lib/format'
import { LeadStatus } from '@/lib/types'
import type { DashboardSummary, PipelineRow, AgentPerformance } from '@/lib/types'

// Demo data for when backend is not connected
const demoSummary: DashboardSummary = {
  totalProperties: 156,
  availableProperties: 89,
  soldProperties: 45,
  totalLeads: 324,
  activeLeads: 187,
  totalDeals: 67,
  closedDeals: 52,
  totalRevenue: 28500000,
  totalAgents: 12,
  activeAgents: 10,
}

const demoPipeline: PipelineRow[] = [
  { status: LeadStatus.NEW, count: 45 },
  { status: LeadStatus.CONTACTED, count: 62 },
  { status: LeadStatus.VISIT_SCHEDULED, count: 38 },
  { status: LeadStatus.OFFER_MADE, count: 24 },
  { status: LeadStatus.DEAL_CLOSED, count: 52 },
  { status: LeadStatus.LOST, count: 18 },
]

const demoAgentPerformance: AgentPerformance[] = [
  { agent_id: 1, agent_name: 'Sarah Johnson', email: 'sarah@proptrack.com', active_leads: 28, conversion_rate_pct: 42 },
  { agent_id: 2, agent_name: 'Ahmed Hassan', email: 'ahmed@proptrack.com', active_leads: 24, conversion_rate_pct: 38 },
  { agent_id: 3, agent_name: 'Maria Garcia', email: 'maria@proptrack.com', active_leads: 19, conversion_rate_pct: 35 },
  { agent_id: 4, agent_name: 'John Smith', email: 'john@proptrack.com', active_leads: 16, conversion_rate_pct: 31 },
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

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useSWR<DashboardSummary>(
    `${API_URL}/dashboard/summary`,
    fetcher,
    { fallbackData: demoSummary, revalidateOnFocus: false }
  )

  const { data: pipeline, isLoading: pipelineLoading } = useSWR<PipelineRow[]>(
    `${API_URL}/dashboard/pipeline`,
    fetcher,
    { fallbackData: demoPipeline, revalidateOnFocus: false }
  )

  const { data: agentPerformance, isLoading: agentLoading } = useSWR<AgentPerformance[]>(
    `${API_URL}/dashboard/agent-performance`,
    fetcher,
    { fallbackData: demoAgentPerformance, revalidateOnFocus: false }
  )

  const stats = [
    {
      title: 'Total Properties',
      value: formatNumber(summary?.totalProperties || 0),
      description: `${summary?.availableProperties || 0} available`,
      icon: Building2,
    },
    {
      title: 'Active Leads',
      value: formatNumber(summary?.activeLeads || 0),
      description: `${summary?.totalLeads || 0} total`,
      icon: Users,
    },
    {
      title: 'Open Deals',
      value: formatNumber((summary?.totalDeals || 0) - (summary?.closedDeals || 0)),
      description: `${summary?.closedDeals || 0} closed`,
      icon: Handshake,
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(summary?.totalRevenue || 0),
      description: 'From closed deals',
      icon: DollarSign,
    },
    {
      title: 'Active Agents',
      value: formatNumber(summary?.activeAgents || 0),
      description: `${summary?.totalAgents || 0} total`,
      icon: UserCheck,
    },
    {
      title: 'Conversion Rate',
      value: summary?.totalLeads ? `${Math.round((summary.closedDeals / summary.totalLeads) * 100)}%` : '0%',
      description: 'Leads to deals',
      icon: TrendingUp,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your agency performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaryLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="size-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="mb-1 h-8 w-20" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pipeline & Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Pipeline</CardTitle>
            <CardDescription>Distribution of leads by status</CardDescription>
          </CardHeader>
          <CardContent>
            {pipelineLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pipeline?.map((row) => {
                  const config = leadStatusConfig[row.status]
                  const total = pipeline.reduce((sum, r) => sum + r.count, 0)
                  const percentage = total > 0 ? Math.round((row.count / total) * 100) : 0
                  return (
                    <div key={row.status} className="flex items-center gap-4">
                      <div className="w-28">
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </div>
                      <div className="flex-1">
                        <div className="h-2 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full bg-foreground transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-16 text-right">
                        <span className="font-medium">{row.count}</span>
                        <span className="text-muted-foreground"> ({percentage}%)</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agent Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Top Agents</CardTitle>
            <CardDescription>Performance by active leads and conversion</CardDescription>
          </CardHeader>
          <CardContent>
            {agentLoading ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="mb-1 h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {agentPerformance?.slice(0, 5).map((agent, index) => (
                  <div key={agent.agent_id} className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{agent.agent_name}</p>
                      <p className="truncate text-sm text-muted-foreground">{agent.active_leads} active leads</p>
                    </div>
                    <Badge variant="secondary">{agent.conversion_rate_pct}%</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
