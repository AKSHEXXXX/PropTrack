# PRD.md — PropTrack CRM
## Product Requirements Document

**Version:** 1.0
**Author:** Akshat
**Status:** Active

---

## 1. Overview

PropTrack CRM is a full-stack web application for small real estate agencies to manage properties, leads, agents, clients, deals, and contracts in one place.

### Goals
- Eliminate manual spreadsheet-based lead tracking
- Give managers real-time visibility into team performance
- Automate repetitive workflows via database triggers and procedures
- Demonstrate advanced database concepts for academic submission

### Non-Goals (out of scope for v1)
- Mobile app
- Email/WhatsApp integration
- Payment gateway integration
- Multi-language support
- Public property listing portal

---

## 2. Users

### Agency Manager / Owner
Can see everything. Manages agents, views all deals, monitors pipeline health, sees commission reports.

### Real Estate Agent
Can only see their own assigned leads, properties, and appointments. Cannot see other agents' data.

> Note: For the assignment demo, role-based access can be simplified to a single admin user. Full RBAC is implemented but can be demoed with one account.

---

## 3. Functional Requirements

### 3.1 Authentication
| ID | Requirement |
|---|---|
| AUTH-01 | User can register with email and password |
| AUTH-02 | User can log in and receive a JWT token |
| AUTH-03 | All API endpoints except login/register require valid JWT |
| AUTH-04 | JWT expires in 7 days |
| AUTH-05 | Passwords are hashed with bcrypt (min 10 rounds) |

### 3.2 Agency Management
| ID | Requirement |
|---|---|
| AGC-01 | Create a new agency with name, address, phone, email |
| AGC-02 | View agency details |
| AGC-03 | Update agency details |
| AGC-04 | View all agents belonging to an agency |

### 3.3 Agent Management
| ID | Requirement |
|---|---|
| AGT-01 | Create agent profile linked to an agency |
| AGT-02 | View agent profile including performance stats |
| AGT-03 | Update agent details and commission rate |
| AGT-04 | Deactivate agent (soft delete) |
| AGT-05 | View agent's assigned leads, deals, and appointments |

### 3.4 Client Management
| ID | Requirement |
|---|---|
| CLI-01 | Create client with name, contact, and client type (buyer/seller/renter/landlord) |
| CLI-02 | Search clients by name, email, or phone |
| CLI-03 | View client's full history (leads, appointments, deals) |
| CLI-04 | Update client details |
| CLI-05 | Cannot delete client if they have active leads or deals |

### 3.5 Property Management
| ID | Requirement |
|---|---|
| PRO-01 | Create property listing with full details (location, price, type, area, bedrooms, bathrooms) |
| PRO-02 | Upload multiple images per property |
| PRO-03 | Filter properties by type, status, city, price range |
| PRO-04 | Update property details and status |
| PRO-05 | Property status auto-updates to `sold` when linked deal closes (trigger) |
| PRO-06 | Cannot delete property with active leads or deals |

### 3.6 Lead Management
| ID | Requirement |
|---|---|
| LEA-01 | Create lead linking a client to a property with a budget |
| LEA-02 | View lead pipeline with status breakdown |
| LEA-03 | Update lead status manually (pipeline progression) |
| LEA-04 | Auto-assign lead to agent with fewest active leads (procedure) |
| LEA-05 | Tag leads with custom labels |
| LEA-06 | Stale leads (7+ days no activity) flagged automatically (trigger) |
| LEA-07 | Cannot have duplicate active leads for same client + property |
| LEA-08 | Filter leads by status, agent, date range |

### 3.7 Appointment Management
| ID | Requirement |
|---|---|
| APP-01 | Schedule appointment linked to lead, agent, client, and property |
| APP-02 | Appointment types: site visit, meeting, call |
| APP-03 | Mark appointment as completed, cancelled, or no-show |
| APP-04 | View upcoming appointments by agent or date |
| APP-05 | Cannot schedule two appointments for same agent at same time |

### 3.8 Deal Management
| ID | Requirement |
|---|---|
| DEA-01 | Create deal from a closed lead |
| DEA-02 | Record final sale/rental price |
| DEA-03 | Commission auto-calculated from agent commission rate (function) |
| DEA-04 | Update deal status (pending → active → closed) |
| DEA-05 | Closing a deal triggers property status update (trigger) |
| DEA-06 | View deals by agent, date, status |

### 3.9 Contract Management
| ID | Requirement |
|---|---|
| CON-01 | Attach contract document URL to a deal |
| CON-02 | Contract types: sale, rental, MOU, listing agreement |
| CON-03 | Track contract status (draft → sent → signed) |
| CON-04 | Record signed date and expiry date |

### 3.10 Payment Management
| ID | Requirement |
|---|---|
| PAY-01 | Record payment against a deal |
| PAY-02 | Payment types: full, installment, deposit, commission |
| PAY-03 | Track payment status (pending, completed, failed) |
| PAY-04 | View payment history for a deal |
| PAY-05 | Calculate total paid vs deal value |

### 3.11 Dashboard & Reports
| ID | Requirement |
|---|---|
| DAS-01 | Total active leads, deals, properties (counts) |
| DAS-02 | Lead pipeline breakdown by status |
| DAS-03 | Agent performance: leads handled, deals closed, commission earned |
| DAS-04 | Properties viewed but never offered on (correlated query) |
| DAS-05 | Agents with no closed deals this month (nested query) |
| DAS-06 | Top 5 agents by deal value this month |

---

## 4. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | API response time < 500ms for all endpoints |
| Security | JWT auth on all protected routes, bcrypt passwords, no raw SQL injection vectors |
| Validation | All inputs validated via class-validator DTOs before hitting service layer |
| Error Handling | Global exception filter, consistent error response format |
| Documentation | All endpoints documented via Swagger |
| Testing | >80% code coverage on service layer, all critical paths have integration tests |
| Code Quality | ESLint + Prettier enforced, no TypeScript errors |

---

## 5. API Response Format

All API responses follow this shape:

```typescript
// Success
{
  statusCode: 200,
  message: "Operation successful",
  data: { ... }
}

// Paginated
{
  statusCode: 200,
  message: "Fetched successfully",
  data: {
    items: [...],
    total: 100,
    page: 1,
    limit: 20,
    totalPages: 5
  }
}

// Error
{
  statusCode: 404,
  message: "Property not found",
  error: "Not Found"
}
```

---

## 6. Database Requirements (Assignment-Specific)

### Triggers (3 required)
| ID | Name | When | What it Does |
|---|---|---|---|
| TRG-01 | `trg_close_deal_update_property` | AFTER UPDATE on deals when status → closed | Sets linked property status to sold |
| TRG-02 | `trg_flag_stale_leads` | AFTER UPDATE on leads | Sets stale flag if last_activity > 7 days ago |
| TRG-03 | `trg_audit_log_deals` | AFTER INSERT OR UPDATE on deals | Writes record to deal_audit_log table |

### Stored Procedures (2 required)
| ID | Name | What it Does |
|---|---|---|
| PRC-01 | `sp_auto_assign_lead` | Assigns lead to agent with fewest active leads in the agency |
| PRC-02 | `sp_generate_monthly_report` | Aggregates agent performance stats for a given month |

### Functions (2 required)
| ID | Name | What it Returns |
|---|---|---|
| FN-01 | `fn_calculate_commission` | Returns commission amount given deal_id |
| FN-02 | `fn_get_agent_conversion_rate` | Returns % of leads that became deals for an agent |

### Queries
- 3 nested queries in dashboard endpoints
- 2 correlated queries in report endpoints

All documented with full SQL in `DATABASE.md`.

---

## 7. Acceptance Criteria

The project is complete when:

- [ ] All 13 tables exist with correct constraints and relationships
- [ ] All CRUD endpoints for all 10 modules work correctly
- [ ] JWT authentication protects all routes
- [ ] All 3 triggers execute automatically and correctly
- [ ] Both stored procedures execute and return correct results
- [ ] Both SQL functions return correct calculations
- [ ] All nested and correlated queries return correct results
- [ ] Qualification test suite passes with 0 failures
- [ ] Swagger documentation is accessible and accurate
- [ ] Docker Compose starts the full stack with one command
- [ ] Frontend connects to backend and displays live data
