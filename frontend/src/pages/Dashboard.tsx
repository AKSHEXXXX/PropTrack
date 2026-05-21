import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  Calendar, 
  UserSquare2, 
  Mail, 
  AlertCircle,
  Clock,
  Video,
  Activity,
  Target,
  Zap,
  UserCheck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import api from '../api/axios';
import { Avatar } from '../components/ui/Avatar';
import toast from 'react-hot-toast';

interface SummaryData {
  totalProperties: string;
  availableProperties: string;
  soldProperties: string;
  totalLeads: string;
  activeLeads: string;
  totalDeals: string;
  closedDeals: string | null;
  totalRevenue: string;
  totalAgents: string;
  activeAgents: string;
}

interface PipelineStatus {
  status: string;
  count: number;
}

interface AgentPerformance {
  agent_id: number;
  agent_name: string;
  email: string;
  active_leads: number;
  conversion_rate_pct: number;
}

interface TopAgent {
  agent_id: number;
  agent_name: string;
  deals_closed: number;
  total_deal_value: number;
  total_commission: number;
  conversion_rate_pct: number;
}

interface UpcomingAppointment {
  appointment_id: number;
  scheduled_at: string;
  purpose: string;
  status: string;
  client_name?: string;
  property_title?: string;
}

// Memoji avatar mapping by agent index
const MEMOJI_AVATARS = [
  '/avatars/avatar-1.png',
  '/avatars/avatar-2.png',
  '/avatars/avatar-3.png',
  '/avatars/avatar-4.png',
  '/avatars/avatar-5.png',
  '/avatars/avatar-6.png',
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Dashboard states
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [pipeline, setPipeline] = useState<PipelineStatus[]>([]);
  const [agentsPerf, setAgentsPerf] = useState<AgentPerformance[]>([]);
  const [topAgents, setTopAgents] = useState<TopAgent[]>([]);
  const [appointments, setAppointments] = useState<UpcomingAppointment[]>([]);

  const [revenueTimeframe, setRevenueTimeframe] = useState<'ytd' | 'month'>('ytd');
  const [loading, setLoading] = useState<boolean>(true);

  // Format currency helper
  const formatCurrency = (val: string | number | null) => {
    if (!val) return 'AED 0';
    const num = Number(val);
    if (num >= 1000000) {
      return `AED ${(num / 1000000).toFixed(1)}M`;
    }
    return `AED ${num.toLocaleString()}`;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [sumRes, pipeRes, perfRes, topRes, apptRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/pipeline'),
          api.get('/dashboard/agent-performance'),
          api.get('/dashboard/top-agents'),
          api.get('/appointments/upcoming'),
        ]);

        setSummary(sumRes.data);
        setPipeline(pipeRes.data || []);
        setAgentsPerf(perfRes.data || []);
        setTopAgents(topRes.data || []);
        setAppointments(apptRes.data || []);
      } catch (err: any) {
        console.error('Error fetching dashboard data', err);
        toast.error('Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="sidebar-logo-circle" style={{ margin: '0 auto 16px', animation: 'spin 1.5s linear infinite' }}>
            <Building2 size={24} />
          </div>
          <p style={{ color: '#6B7280', fontWeight: 600 }}>Loading dashboard analytics...</p>
        </div>
      </div>
    );
  }

  // Target Revenue Calculation
  // Target: AED 5M YTD, AED 500K monthly.
  const revenueNum = Number(summary?.totalRevenue || 0);
  const targetRevenue = revenueTimeframe === 'ytd' ? 5000000 : 500000;
  const revenuePct = Math.min(Math.round((revenueNum / targetRevenue) * 100), 100);

  const revenuePieData = [
    { name: 'Achieved', value: revenueNum },
    { name: 'Remaining', value: Math.max(0, targetRevenue - revenueNum) }
  ];

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (revenuePct / 100) * circumference;

  return (
    <div className="page-container">
      {/* SVG definitions for hatched chart patterns */}
      <svg className="hatched-pattern-svg">
        <defs>
          <pattern id="diagonalHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="10" stroke="#4CAF82" strokeWidth="2.5" />
          </pattern>
          <pattern id="diagonalHatchSecondary" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="10" stroke="#2D6A4F" strokeWidth="2.5" />
          </pattern>
        </defs>
      </svg>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#1A3C2E' }}>Welcome back</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Here is what's happening in your agency today</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/appointments')}>
          <Calendar size={16} /> Schedule Appointment
        </button>
      </div>

      {/* Top Stat Cards Grid */}
      <div className="stat-cards-grid">
        {/* Card 1: Total Properties (Dark Green) */}
        <div className="card dark">
          <div className="card-header-row">
            <span style={{ fontSize: '0.75rem', opacity: 0.9, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Properties</span>
            <button className="arrow-diagonal-btn" onClick={() => navigate('/properties')}>
              <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="stat-card-value">{summary?.totalProperties || 0}</div>
          <div className="stat-card-subtext">
            <span>Available: {summary?.availableProperties || 0}</span>
            <span style={{ opacity: 0.6 }}>•</span>
            <span>Sold: {summary?.soldProperties || 0}</span>
          </div>
        </div>

        {/* Card 2: Active Leads */}
        <div className="card">
          <div className="card-header-row">
            <span style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Active Leads</span>
            <button className="arrow-diagonal-btn dark" onClick={() => navigate('/leads')}>
              <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="stat-card-value" style={{ color: '#1A3C2E' }}>{summary?.activeLeads || 0}</div>
          <div className="stat-card-subtext">
            <span style={{ color: '#4CAF82', fontWeight: 600 }}>Total pipeline: {summary?.totalLeads || 0}</span>
          </div>
        </div>

        {/* Card 3: Deals Closed */}
        <div className="card">
          <div className="card-header-row">
            <span style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Deals Closed</span>
            <button className="arrow-diagonal-btn dark" onClick={() => navigate('/deals')}>
              <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="stat-card-value" style={{ color: '#1A3C2E' }}>{summary?.closedDeals || 0}</div>
          <div className="stat-card-subtext">
            <span>Total transactions: {summary?.totalDeals || 0}</span>
          </div>
        </div>

        {/* Card 4: Conversion Rate */}
        <div className="card">
          <div className="card-header-row">
            <span style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Conversion Rate</span>
            <button className="arrow-diagonal-btn dark" onClick={() => navigate('/leads')}>
              <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="stat-card-value" style={{ color: '#1A3C2E', fontSize: '2.2rem' }}>
            {(() => {
              const total = Number(summary?.totalLeads || 0);
              const closed = Number(summary?.closedDeals || 0);
              if (total === 0) return '0%';
              return `${((closed / total) * 100).toFixed(1)}%`;
            })()}
          </div>
          <div className="stat-card-subtext">
            <span style={{ color: '#4CAF82', fontWeight: 600 }}>{summary?.closedDeals || 0} closed from {summary?.totalLeads || 0} leads</span>
          </div>
        </div>
      </div>

      {/* Row 1: Pipeline Analytics & Revenue Tracker */}
      <div className="dashboard-row-2col">
        {/* Column 1: Pipeline Analytics */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Pipeline Analytics</h3>
          <div style={{ height: '300px', width: '100%' }}>
            {pipeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="status" tickFormatter={(str) => str.replace('_', ' ').toUpperCase()} tick={{ fontSize: 10, fill: '#6B7280' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} allowDecimals={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(76, 175, 130, 0.05)' }} 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontFamily: 'Plus Jakarta Sans' }}
                  />
                  <Bar dataKey="count" fill="url(#diagonalHatch)" radius={[8, 8, 0, 0]}>
                    {pipeline.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.status === 'deal_closed' ? 'url(#diagonalHatchSecondary)' : 'url(#diagonalHatch)'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF' }}>
                No active leads on pipeline
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Revenue Tracker */}
        <div className="card time-tracker-card" style={{ color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="time-tracker-waves"></div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#E8F5EE' }}>Revenue Tracker</span>
              <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '999px', padding: '2px' }}>
                <button 
                  style={{
                    backgroundColor: revenueTimeframe === 'ytd' ? 'white' : 'transparent',
                    color: revenueTimeframe === 'ytd' ? '#1A3C2E' : 'white',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setRevenueTimeframe('ytd')}
                >
                  YTD
                </button>
                <button 
                  style={{
                    backgroundColor: revenueTimeframe === 'month' ? 'white' : 'transparent',
                    color: revenueTimeframe === 'month' ? '#1A3C2E' : 'white',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setRevenueTimeframe('month')}
                >
                  MONTH
                </button>
              </div>
            </div>
            
            <h4 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
              {formatCurrency(revenueNum)}
            </h4>
            <p style={{ fontSize: '0.75rem', color: '#4CAF82', marginTop: '2px' }}>
              Target: {formatCurrency(targetRevenue)}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
            <div style={{ position: 'relative', width: '110px', height: '110px' }}>
              <svg width="110" height="110" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4CAF82" />
                    <stop offset="100%" stopColor="#A3E635" />
                  </linearGradient>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="url(#revenueGradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1.5s ease-in-out' }}
                />
              </svg>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
              }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{revenuePct}%</span>
                <span style={{ fontSize: '8px', color: '#E8F5EE', textTransform: 'uppercase' }}>Target</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '12px' }}>
            <span style={{ fontSize: '0.75rem', color: '#E8F5EE' }}>
              {revenuePct === 100 ? 'Target achieved! 🎉' : `Need ${formatCurrency(Math.max(0, targetRevenue - revenueNum))} more to hit target`}
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Upcoming Appointments, Recent Leads & Top Agents */}
      <div className="dashboard-row-3col">
        {/* Recent Activity */}
        <div className="card">
          <div className="card-header-row">
            <h3 className="card-title" style={{ fontSize: '1rem' }}>Recent Activity</h3>
            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '10px' }} onClick={() => navigate('/leads')}>
              View All
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0', marginTop: '8px' }}>
            {(() => {
              const activities = [
                { icon: <Zap size={14} />, iconBg: '#FEF3C7', iconColor: '#D97706', title: 'New lead assigned', desc: `${summary?.activeLeads || 0} leads currently in pipeline`, time: '2h ago' },
                { icon: <Target size={14} />, iconBg: '#DBEAFE', iconColor: '#1D4ED8', title: 'Deal negotiation started', desc: `${summary?.totalDeals || 0} total deals in progress`, time: '4h ago' },
                { icon: <UserCheck size={14} />, iconBg: '#E8F5EE', iconColor: '#2D6A4F', title: 'Client follow-up completed', desc: `${summary?.closedDeals || 0} deals closed this period`, time: '6h ago' },
                { icon: <Activity size={14} />, iconBg: '#FCE7F3', iconColor: '#BE185D', title: 'Property viewing scheduled', desc: `${summary?.availableProperties || 0} properties available`, time: '8h ago' },
              ];
              return activities.map((act, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderBottom: idx < activities.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: act.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: act.iconColor,
                    flexShrink: 0
                  }}>
                    {act.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#1A3C2E' }}>{act.title}</div>
                    <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '1px' }}>{act.desc}</div>
                  </div>
                  <span style={{ fontSize: '0.625rem', color: '#9CA3AF', flexShrink: 0, marginTop: '2px' }}>{act.time}</span>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Next Meeting */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header-row">
            <h3 className="card-title" style={{ fontSize: '1rem' }}>Next Meeting</h3>
            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '10px' }} onClick={() => navigate('/appointments')}>
              All Meetings
            </button>
          </div>
          {appointments.length > 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', marginTop: '12px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1A3C2E', lineHeight: 1.3 }}>
                {appointments[0].purpose || 'Property Viewing'}
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} />
                Time : {new Date(appointments[0].scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(new Date(appointments[0].scheduled_at).getTime() + 2 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              {appointments[0].client_name && (
                <p style={{ fontSize: '0.8125rem', color: '#4CAF82', marginTop: '4px', fontWeight: 500 }}>
                  with {appointments[0].client_name}
                </p>
              )}
              <button 
                className="btn btn-primary" 
                style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', width: '100%', borderRadius: '12px', padding: '12px 20px' }}
                onClick={() => navigate('/appointments')}
              >
                <Video size={18} /> Start Meeting
              </button>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0', color: '#9CA3AF' }}>
              <Calendar size={32} style={{ opacity: 0.4, marginBottom: '12px' }} />
              <span style={{ fontSize: '0.875rem' }}>No upcoming meetings</span>
            </div>
          )}
        </div>

        {/* Team Collaboration */}
        <div className="card">
          <div className="card-header-row">
            <h3 className="card-title" style={{ fontSize: '1rem' }}>Team Collaboration</h3>
            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '10px' }} onClick={() => navigate('/agents')}>
              View Team
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0', marginTop: '8px' }}>
            {(() => {
              const agentsList = topAgents.length > 0 ? topAgents : agentsPerf.slice(0, 5).map(a => ({ ...a, deals_closed: 0, total_deal_value: 0, total_commission: 0 }));
              const statusLabels = ['Completed', 'In Progress', 'Pending', 'In Progress', 'Completed'];
              const statusColors: Record<string, { bg: string; text: string }> = {
                'Completed': { bg: '#E8F5EE', text: '#2D6A4F' },
                'In Progress': { bg: '#DBEAFE', text: '#1D4ED8' },
                'Pending': { bg: '#FEF3C7', text: '#D97706' },
              };
              return agentsList.length > 0 ? (
                agentsList.slice(0, 4).map((agent, idx) => {
                  const status = statusLabels[idx % statusLabels.length];
                  const colors = statusColors[status];
                  const dealLabel = 'deals_closed' in agent 
                    ? `Closed ${(agent as TopAgent).deals_closed} ${(agent as TopAgent).deals_closed === 1 ? 'deal' : 'deals'} this month`
                    : `Managing ${(agent as AgentPerformance).active_leads} active leads`;
                  return (
                    <div key={agent.agent_id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: idx < 3 ? '1px solid #F3F4F6' : 'none' }}>
                      <img 
                        src={MEMOJI_AVATARS[idx % MEMOJI_AVATARS.length]} 
                        alt={agent.agent_name}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#1A3C2E' }}>{agent.agent_name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {dealLabel}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: '12px',
                        backgroundColor: colors.bg,
                        color: colors.text,
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}>
                        {status}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '24px 0' }}>
                  <UserSquare2 size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <span style={{ fontSize: '0.75rem' }}>No team members found</span>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};
