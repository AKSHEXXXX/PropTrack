# API_SPEC.md — PropTrack CRM
## Complete API Reference

**Base URL:** `http://localhost:3000/api/v1`
**Auth:** All endpoints require `Authorization: Bearer <token>` header except `/auth/*`

---

## Auth

### POST /auth/register
Create a new user account.

**Request:**
```json
{
  "email": "agent@proptrack.com",
  "password": "SecurePass123!",
  "role": "agent"
}
```
**Response 201:**
```json
{
  "statusCode": 201,
  "message": "Registration successful",
  "data": { "id": 1, "email": "agent@proptrack.com", "role": "agent" }
}
```

### POST /auth/login
Login and receive JWT token.

**Request:**
```json
{ "email": "agent@proptrack.com", "password": "SecurePass123!" }
```
**Response 200:**
```json
{
  "statusCode": 200,
  "message": "Login successful",
  "data": { "accessToken": "eyJhbGci...", "role": "agent" }
}
```

---

## Agencies

| Method | Endpoint | Description |
|---|---|---|
| GET | /agencies | List all agencies (paginated) |
| GET | /agencies/:id | Get agency by ID (includes agents) |
| POST | /agencies | Create agency |
| PATCH | /agencies/:id | Update agency |
| DELETE | /agencies/:id | Delete agency |

### POST /agencies — Request Body
```json
{
  "name": "Dubai Realty Group",
  "address": "Downtown Dubai, UAE",
  "phone": "+971501234567",
  "email": "info@dubairealty.com"
}
```

---

## Agents

| Method | Endpoint | Description |
|---|---|---|
| GET | /agents | List all agents (paginated) |
| GET | /agents/:id | Get agent by ID (includes stats) |
| GET | /agents/:id/leads | Get all leads for agent |
| GET | /agents/:id/deals | Get all deals for agent |
| POST | /agents | Create agent |
| PATCH | /agents/:id | Update agent |
| DELETE | /agents/:id | Deactivate agent (soft delete) |

### POST /agents — Request Body
```json
{
  "agencyId": 1,
  "firstName": "Mohammed",
  "lastName": "Al Rashid",
  "email": "m.rashid@dubairealty.com",
  "phone": "+971509876543",
  "commissionRate": 0.025
}
```

---

## Clients

| Method | Endpoint | Description |
|---|---|---|
| GET | /clients | List all clients (paginated, filterable) |
| GET | /clients/:id | Get client with full history |
| POST | /clients | Create client |
| PATCH | /clients/:id | Update client |
| DELETE | /clients/:id | Delete client (blocked if active leads/deals) |

### POST /clients — Request Body
```json
{
  "firstName": "Sarah",
  "lastName": "Johnson",
  "email": "sarah.j@email.com",
  "phone": "+971521234567",
  "clientType": "buyer",
  "nationality": "British"
}
```

### GET /clients — Query Params
| Param | Type | Example |
|---|---|---|
| page | number | 1 |
| limit | number | 20 |
| clientType | string | buyer |
| search | string | sarah |

---

## Properties

| Method | Endpoint | Description |
|---|---|---|
| GET | /properties | List all properties (paginated, filterable) |
| GET | /properties/:id | Get property with images and agent |
| POST | /properties | Create property listing |
| PATCH | /properties/:id | Update property |
| DELETE | /properties/:id | Delete property (blocked if active leads/deals) |
| POST | /properties/:id/images | Add image to property |
| DELETE | /properties/:id/images/:imageId | Remove image |

### POST /properties — Request Body
```json
{
  "agentId": 1,
  "title": "Luxury 2BR Apartment - Downtown Dubai",
  "description": "Stunning views of Burj Khalifa...",
  "location": "Sheikh Mohammed Bin Rashid Blvd",
  "city": "Dubai",
  "price": 2500000,
  "areaSqft": 1200,
  "propertyType": "apartment",
  "status": "available",
  "bedrooms": 2,
  "bathrooms": 2
}
```

### GET /properties — Query Params
| Param | Type | Example |
|---|---|---|
| page | number | 1 |
| limit | number | 20 |
| propertyType | string | apartment |
| status | string | available |
| city | string | Dubai |
| minPrice | number | 1000000 |
| maxPrice | number | 5000000 |
| minBedrooms | number | 2 |

---

## Leads

| Method | Endpoint | Description |
|---|---|---|
| GET | /leads | List all leads (paginated, filterable) |
| GET | /leads/:id | Get lead with full details |
| GET | /leads/pipeline | Get pipeline breakdown by status |
| POST | /leads | Create lead |
| PATCH | /leads/:id | Update lead status or details |
| DELETE | /leads/:id | Delete lead |
| POST | /leads/:id/tags | Add tag to lead |
| DELETE | /leads/:id/tags/:tagId | Remove tag from lead |
| POST | /leads/:id/assign | Auto-assign to agent with least leads |

### POST /leads — Request Body
```json
{
  "clientId": 1,
  "propertyId": 3,
  "agentId": 2,
  "budget": 2200000,
  "notes": "Client prefers high floor, sea view"
}
```

### GET /leads — Query Params
| Param | Type | Example |
|---|---|---|
| page | number | 1 |
| limit | number | 20 |
| status | string | new |
| agentId | number | 2 |
| propertyId | number | 3 |
| isStale | boolean | true |

### Lead Status Flow
```
new → contacted → visit_scheduled → offer_made → deal_closed
                                                → lost
```

---

## Appointments

| Method | Endpoint | Description |
|---|---|---|
| GET | /appointments | List all appointments (paginated) |
| GET | /appointments/:id | Get appointment details |
| GET | /appointments/upcoming | Get upcoming appointments |
| POST | /appointments | Schedule appointment |
| PATCH | /appointments/:id | Update appointment status |
| DELETE | /appointments/:id | Cancel appointment |

### POST /appointments — Request Body
```json
{
  "leadId": 5,
  "agentId": 2,
  "clientId": 1,
  "propertyId": 3,
  "scheduledAt": "2025-08-15T10:00:00Z",
  "type": "site_visit",
  "notes": "Client wants to check parking and amenities"
}
```

### GET /appointments — Query Params
| Param | Type | Example |
|---|---|---|
| agentId | number | 2 |
| status | string | scheduled |
| from | date | 2025-08-01 |
| to | date | 2025-08-31 |

---

## Deals

| Method | Endpoint | Description |
|---|---|---|
| GET | /deals | List all deals (paginated, filterable) |
| GET | /deals/:id | Get deal with contracts and payments |
| POST | /deals | Create deal from lead |
| PATCH | /deals/:id | Update deal status |
| DELETE | /deals/:id | Cancel deal |

### POST /deals — Request Body
```json
{
  "leadId": 5,
  "propertyId": 3,
  "agentId": 2,
  "clientId": 1,
  "finalPrice": 2350000,
  "dealDate": "2025-08-20"
}
```
> Note: `commissionAmount` is auto-calculated via SQL function on insert.

### PATCH /deals/:id — Close a Deal
```json
{ "status": "closed", "closingDate": "2025-09-01" }
```
> Triggers: property status → sold, audit log entry created

### GET /deals — Query Params
| Param | Type | Example |
|---|---|---|
| agentId | number | 2 |
| status | string | active |
| from | date | 2025-08-01 |
| to | date | 2025-08-31 |

---

## Contracts

| Method | Endpoint | Description |
|---|---|---|
| GET | /contracts | List all contracts |
| GET | /contracts/:id | Get contract details |
| POST | /contracts | Attach contract to deal |
| PATCH | /contracts/:id | Update contract status |
| DELETE | /contracts/:id | Delete contract |

### POST /contracts — Request Body
```json
{
  "dealId": 3,
  "documentUrl": "https://storage.proptrack.com/contracts/deal_3_sale.pdf",
  "contractType": "sale",
  "signedDate": "2025-09-01",
  "expiryDate": "2026-09-01"
}
```

---

## Payments

| Method | Endpoint | Description |
|---|---|---|
| GET | /payments | List all payments |
| GET | /payments/:id | Get payment details |
| GET | /payments/deal/:dealId | Get all payments for a deal |
| POST | /payments | Record a payment |
| PATCH | /payments/:id | Update payment status |

### POST /payments — Request Body
```json
{
  "dealId": 3,
  "amount": 500000,
  "paymentType": "deposit",
  "status": "completed",
  "paymentDate": "2025-09-01",
  "referenceNo": "TXN-2025-0901-001"
}
```

---

## Tags

| Method | Endpoint | Description |
|---|---|---|
| GET | /tags | List all tags |
| POST | /tags | Create tag |
| DELETE | /tags/:id | Delete tag |

### POST /tags — Request Body
```json
{ "name": "Hot Lead", "color": "#EF4444" }
```

---

## Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | /dashboard/summary | Overall counts and KPIs |
| GET | /dashboard/pipeline | Lead pipeline breakdown |
| GET | /dashboard/agent-performance | Per-agent stats (nested query) |
| GET | /dashboard/stale-leads | Leads with 7+ days no activity (correlated query) |
| GET | /dashboard/unsold-viewed | Properties viewed but no offer made (correlated query) |
| GET | /dashboard/top-agents | Top 5 agents by deal value this month (nested query) |
| GET | /dashboard/monthly-report | Full monthly report via stored procedure |

### GET /dashboard/summary — Response
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "totalProperties": 45,
    "availableProperties": 30,
    "soldProperties": 15,
    "totalLeads": 120,
    "activeLeads": 80,
    "totalDeals": 25,
    "closedDeals": 20,
    "totalAgents": 8,
    "activeAgents": 7,
    "totalRevenue": 47500000
  }
}
```

---

## Error Reference

| Status | Meaning | When |
|---|---|---|
| 400 | Bad Request | Validation failed, missing required fields |
| 401 | Unauthorized | No token or invalid token |
| 403 | Forbidden | Valid token but insufficient role |
| 404 | Not Found | Resource with given ID doesn't exist |
| 409 | Conflict | Duplicate entry (email, active lead on same property) |
| 500 | Internal Server Error | Unexpected server error |

---

## Shared TypeScript Types

Export from `shared/types/index.ts` for use by frontend:

```typescript
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

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  VISIT_SCHEDULED = 'visit_scheduled',
  OFFER_MADE = 'offer_made',
  DEAL_CLOSED = 'deal_closed',
  LOST = 'lost',
}

export enum ClientType {
  BUYER = 'buyer',
  SELLER = 'seller',
  RENTER = 'renter',
  LANDLORD = 'landlord',
}

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
```
