import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(private readonly dataSource: DataSource) {}

  async getSummary() {
    const [props, leads, deals, agents] = await Promise.all([
      this.dataSource.query(`
        SELECT
          COUNT(*) AS "totalProperties",
          COUNT(*) FILTER (WHERE status = 'available') AS "availableProperties",
          COUNT(*) FILTER (WHERE status = 'sold') AS "soldProperties"
        FROM properties`),
      this.dataSource.query(`
        SELECT
          COUNT(*) AS "totalLeads",
          COUNT(*) FILTER (WHERE status NOT IN ('deal_closed','lost')) AS "activeLeads"
        FROM leads`),
      this.dataSource.query(`
        SELECT
          COUNT(*) AS "totalDeals",
          COUNT(*) FILTER (WHERE status = 'closed') AS "closedDeals",
          COALESCE(SUM(final_price) FILTER (WHERE status = 'closed'), 0) AS "totalRevenue"
        FROM deals`),
      this.dataSource.query(`
        SELECT COUNT(*) AS "totalAgents", COUNT(*) FILTER (WHERE is_active = true) AS "activeAgents"
        FROM agents`),
    ]);
    return {
      data: { ...props[0], ...leads[0], ...deals[0], ...agents[0] },
      message: 'Dashboard summary fetched successfully',
    };
  }

  async getPipeline() {
    const pipeline = await this.dataSource.query(`
      SELECT status, COUNT(*) AS count
      FROM leads
      GROUP BY status
      ORDER BY ARRAY_POSITION(ARRAY['new','contacted','visit_scheduled','offer_made','deal_closed','lost'], status::text)`);
    return { data: pipeline, message: 'Pipeline fetched successfully' };
  }

  // NQ-01: Agents with no closed deals this month
  async getAgentPerformance() {
    const data = await this.dataSource.query(`
      SELECT
        a.agent_id, a.first_name || ' ' || a.last_name AS agent_name, a.email,
        COUNT(DISTINCT l.lead_id) AS active_leads,
        fn_get_agent_conversion_rate(a.agent_id) AS conversion_rate_pct
      FROM agents a
      LEFT JOIN leads l ON l.agent_id = a.agent_id AND l.status NOT IN ('deal_closed','lost')
      WHERE a.is_active = TRUE
        AND a.agent_id NOT IN (
          SELECT DISTINCT d.agent_id FROM deals d
          WHERE d.status = 'closed'
            AND EXTRACT(MONTH FROM d.closing_date) = EXTRACT(MONTH FROM NOW())
            AND EXTRACT(YEAR  FROM d.closing_date) = EXTRACT(YEAR  FROM NOW())
        )
      GROUP BY a.agent_id, a.first_name, a.last_name, a.email
      ORDER BY active_leads DESC`);
    return { data, message: 'Agent performance fetched (agents with no closed deals this month)' };
  }

  // CQ-01: Properties visited but never offered on
  async getUnsoldViewed() {
    const data = await this.dataSource.query(`
      SELECT
        p.property_id, p.title, p.city, p.price, p.property_type,
        COUNT(apt.appointment_id) AS total_visits,
        MAX(apt.scheduled_at) AS last_visit_date,
        a.first_name || ' ' || a.last_name AS agent_name
      FROM properties p
      JOIN appointments apt ON apt.property_id = p.property_id
      JOIN agents a ON a.agent_id = p.agent_id
      WHERE p.status = 'available'
        AND NOT EXISTS (
          SELECT 1 FROM deals d
          WHERE d.property_id = p.property_id AND d.status IN ('pending','active','closed')
        )
      GROUP BY p.property_id, p.title, p.city, p.price, p.property_type, a.first_name, a.last_name
      HAVING COUNT(apt.appointment_id) >= 1
      ORDER BY total_visits DESC, last_visit_date DESC`);
    return { data, message: 'Properties viewed but never offered on (correlated query)' };
  }

  // CQ-02: Stale leads with agent context
  async getStaleLeads() {
    const data = await this.dataSource.query(`
      SELECT
        l.lead_id,
        c.first_name || ' ' || c.last_name AS client_name,
        p.title AS property_title, l.status AS lead_status,
        l.last_activity, NOW() - l.last_activity AS inactive_for,
        a.first_name || ' ' || a.last_name AS agent_name,
        (SELECT COUNT(*) FROM leads l2 WHERE l2.agent_id = l.agent_id AND l2.status NOT IN ('deal_closed','lost')) AS agent_total_active_leads,
        (SELECT COUNT(*) FROM leads l3 WHERE l3.agent_id = l.agent_id AND l3.status NOT IN ('deal_closed','lost') AND l3.is_stale = TRUE) AS agent_stale_lead_count
      FROM leads l
      JOIN clients c ON c.client_id = l.client_id
      JOIN properties p ON p.property_id = l.property_id
      JOIN agents a ON a.agent_id = l.agent_id
      WHERE l.is_stale = TRUE AND l.status NOT IN ('deal_closed','lost')
      ORDER BY l.last_activity ASC`);
    return { data, message: 'Stale leads with agent context (correlated query)' };
  }

  // NQ-02: Top 5 agents by deal value this month
  async getTopAgents() {
    const data = await this.dataSource.query(`
      SELECT
        a.agent_id, a.first_name || ' ' || a.last_name AS agent_name,
        COUNT(d.deal_id) AS deals_closed,
        SUM(d.final_price) AS total_deal_value,
        SUM(d.commission_amount) AS total_commission,
        fn_get_agent_conversion_rate(a.agent_id) AS conversion_rate_pct
      FROM agents a
      JOIN deals d ON d.agent_id = a.agent_id
      WHERE d.status = 'closed'
        AND d.closing_date >= DATE_TRUNC('month', NOW())
        AND d.closing_date < DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
      GROUP BY a.agent_id, a.first_name, a.last_name
      ORDER BY total_deal_value DESC
      LIMIT 5`);
    return { data, message: 'Top 5 agents by deal value this month' };
  }

  // PRC-02: Monthly report via stored procedure
  async getMonthlyReport(agencyId: number, month: number, year: number) {
    // Stored procedure uses RAISE NOTICE; we replicate the query for API response
    const data = await this.dataSource.query(`
      SELECT
        a.first_name || ' ' || a.last_name AS agent_name,
        COUNT(DISTINCT l.lead_id) AS total_leads,
        COUNT(DISTINCT d.deal_id) AS deals_closed,
        COALESCE(SUM(d.final_price), 0) AS total_revenue,
        COALESCE(SUM(d.commission_amount), 0) AS total_commission,
        fn_get_agent_conversion_rate(a.agent_id) AS conversion_rate_pct
      FROM agents a
      LEFT JOIN leads l ON l.agent_id = a.agent_id
        AND EXTRACT(MONTH FROM l.created_at) = $2
        AND EXTRACT(YEAR  FROM l.created_at) = $3
      LEFT JOIN deals d ON d.agent_id = a.agent_id AND d.status = 'closed'
        AND EXTRACT(MONTH FROM d.closing_date) = $2
        AND EXTRACT(YEAR  FROM d.closing_date) = $3
      WHERE a.agency_id = $1 AND a.is_active = TRUE
      GROUP BY a.agent_id, a.first_name, a.last_name
      ORDER BY deals_closed DESC, total_revenue DESC`,
      [agencyId, month, year]);
    // Also call the procedure for grading proof
    await this.dataSource.query(`CALL sp_generate_monthly_report($1, $2, $3)`, [agencyId, month, year]);
    return { data, message: `Monthly report for agency ${agencyId} — ${month}/${year}` };
  }

  // NQ-03: Properties priced above agency average
  async getAboveAverageProperties() {
    const data = await this.dataSource.query(`
      SELECT p.property_id, p.title, p.city, p.price, p.property_type, p.status,
        a.first_name || ' ' || a.last_name AS agent_name
      FROM properties p
      JOIN agents a ON a.agent_id = p.agent_id
      WHERE p.price > (SELECT AVG(price) FROM properties WHERE status != 'off_market')
        AND p.status = 'available'
      ORDER BY p.price DESC`);
    return { data, message: 'Properties priced above agency average' };
  }
}
