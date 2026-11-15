# ResolveHQ – Multi-Tenant Helpdesk & Customer Support Platform

A full-stack, multi-tenant customer support platform where administrators and support agents manage tickets, customers, and conversations, while customers get their own self-service portal to raise tickets and communicate directly with support teams.

Built to demonstrate production-style backend architecture, authentication, authorization, database design, real-time communication, and deployment.

🌐 **Live Application:** https://resolve-hq-one.vercel.app

💻 **GitHub Repository:** https://github.com/Yashk879/ResolveHQ

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Database Design](#database-design)
- [Multi-Tenant Architecture](#multi-tenant-architecture)
- [Authentication & Authorization](#authentication--authorization)
- [Real-Time Communication](#real-time-communication)
- [SLA Management](#sla-management)
- [Email Notifications](#email-notifications)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Security Considerations](#security-considerations)
- [Known Limitations & Roadmap](#known-limitations--roadmap)
- [Engineering Concepts Demonstrated](#engineering-concepts-demonstrated)
- [Author](#author)

---

## Overview

ResolveHQ is a multi-tenant customer support and helpdesk platform designed to help businesses manage customer support operations efficiently.

Multiple companies can use the same application and database while their agents, customers, tickets, and conversations are scoped to their respective companies.

The platform consists of two separate interfaces sharing one backend:

**1. Agent/Admin Dashboard**
- Manage customer support tickets.
- Assign and reassign tickets to agents.
- Manage customers and support agents.
- Track ticket status and priority.
- Monitor support statistics and SLA information.
- Communicate with customers through ticket conversations.

**2. Customer Self-Service Portal**
- Independent customer signup and login.
- Raise support tickets.
- Track submitted tickets.
- View ticket conversations.
- Reply directly to support agents.
- Receive email notifications for supported events.

The project focuses on backend architecture, tenant-aware database queries, secure authentication, and real-time communication rather than just basic CRUD functionality.

---

## Key Features

### 1. Core Helpdesk – Agent/Admin

- Company registration with its first administrator account.
- Ticket creation, listing, viewing, updating, and deletion.
- Ticket filtering by status and priority.
- Ticket search and pagination.
- Assign and reassign tickets to support agents.
- Customer management and ticket history.
- Agent management with admin-only permissions.
- Role-based dashboards.
- Company-wide statistics for administrators.
- Assigned-ticket statistics for agents.

### 2. Customer Self-Service Portal

- Separate customer signup and login system.
- Public company directory for selecting a company during signup.
- Create support tickets without requiring an agent.
- View personal ticket history.
- View individual ticket details.
- Access complete conversation history.
- Reply directly to support agents.
- Real-time conversation updates.

Ticket priority is controlled by the support team rather than the customer, allowing agents to handle ticket triage.

### 3. Authentication & Authorization

- Separate authentication systems for agents and customers.
- JWT-based authentication.
- HTTP-only authentication cookies.
- Password hashing using bcrypt.
- Role-based access control.
- Protected backend routes.
- Forgot password and reset password functionality.
- Single-use password reset tokens with expiration.
- Separate session handling for agents and customers.

### 4. Real-Time Communication

- Socket.IO integration.
- Real-time ticket creation and update events.
- Real-time ticket conversation updates.
- Company-scoped socket rooms.
- No manual page refresh required for supported live updates.

### 5. SLA Management

- Configurable SLA policies based on ticket priority.
- First-response deadline calculation.
- Resolution deadline calculation.
- First-response SLA status tracking.
- Resolution SLA status tracking.
- SLA status updates when agents respond to or resolve tickets.
- Background monitoring for overdue tickets.

### 6. Email Notifications

Email functionality is implemented through a shared mailer utility using the Resend API.

Supported notifications include:

- Password reset emails.
- Contact form notifications.
- Customer ticket submission confirmations.
- Agent ticket assignment notifications.
- Customer notifications when an agent replies to a ticket.

**Note:** The current Resend testing sender has recipient restrictions. Sending to arbitrary customer addresses requires a verified sending domain.

---

## Architecture

ResolveHQ follows a client-server architecture with separate frontend and backend applications.

```text
             ADMIN / AGENT / CUSTOMER
                       |
                       |
                React Frontend
                    Vercel
                       |
                       |
                 REST APIs
                       |
                       |
              Node.js + Express
                    Render
                       |
          +------------+------------+
          |            |            |
          |            |            |
      PostgreSQL    Socket.IO     Resend
        Neon        Real-Time     Email API
                    Updates
```

### Request Flow

1. The user interacts with the React frontend.
2. The frontend sends requests to the Express backend.
3. Authentication middleware validates the session.
4. Authorization middleware checks the user's permissions.
5. Controllers execute business logic and interact with PostgreSQL.
6. Socket.IO broadcasts relevant events to connected clients.
7. The email service handles supported email notifications.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Vite, JavaScript |
| Routing | React Router |
| State Management | React Context API |
| HTTP Client | Axios |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Real-Time Communication | Socket.IO |
| Authentication | JWT, HTTP-only Cookies |
| Password Hashing | bcrypt |
| Email Service | Resend |
| API Testing | Postman |
| Version Control | Git, GitHub |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |
| Database Hosting | Neon PostgreSQL |

---

## Database Design

ResolveHQ uses PostgreSQL as its relational database.

The database design uses foreign keys, unique constraints, indexes, and tenant-aware relationships to maintain data consistency and support multiple companies.

### Important Design Decisions

**1. Nullable Customer Passwords**

`customers.password_hash` can be nullable so that an agent can create a customer record before the customer registers for the self-service portal.

A customer can subsequently register and claim an existing passwordless record.

**2. Different Email Uniqueness Rules**

- Agent email addresses are globally unique because agents authenticate without selecting a company first.
- Customer email addresses are unique within a company using a composite constraint:

```sql
UNIQUE(company_id, email)
```

This allows the same person to be a customer of multiple companies.

**3. Explicit Message Sender Columns**

The messages table uses separate nullable sender columns:

- `sender_agent_id`
- `sender_customer_id`

This makes it straightforward to identify whether a message was sent by an agent or a customer.

**4. Optional Ticket Assignment**

`tickets.assigned_agent_id` is nullable.

A ticket created by a customer can remain unassigned until an administrator assigns it to a support agent.

**5. SLA Tracking**

Tickets store first-response and resolution deadlines along with their corresponding SLA statuses.

This allows the application to track whether support teams meet their configured response and resolution targets.

---

## Multi-Tenant Architecture

Each company represents an independent tenant.

All tenants share the same application instance and PostgreSQL database, while company-owned records are scoped using `company_id`.

The backend derives company identity from the authenticated user's verified JWT rather than trusting a company ID supplied by the client.

For example:

```sql
SELECT *
FROM tickets
WHERE id = $1
AND company_id = $2;
```

For customer-facing operations, the backend also checks the authenticated customer's identity:

```sql
SELECT *
FROM tickets
WHERE id = $1
AND company_id = $2
AND customer_id = $3;
```

This approach ensures that ticket access is checked against both company and user identity.

The same tenant-scoping principle is applied throughout company-owned operations.

---

## Authentication & Authorization

ResolveHQ implements two separate authentication systems sharing one backend.

This separation ensures that customer sessions cannot be used as agent sessions and vice versa.

| Component | Agents | Customers |
|---|---|---|
| Cookie | `token` | `customer_token` |
| JWT Identity | `agentId` | `customerId` |
| Company Identity | `companyId` | `companyId` |
| Authorization | Role-based | Customer ownership |
| Middleware | `requireLogin` | `requireCustomerLogin` |

### Role-Based Access Control

The application supports two agent roles:

**Admin**
- View company-wide tickets.
- Create and manage agents.
- Assign tickets.
- Access company statistics.
- Perform administrative operations.

**Agent**
- View assigned tickets.
- Respond to tickets.
- Update permitted ticket fields.
- Access agent-specific statistics.

Authorization is enforced on the backend. Frontend route protection and hidden navigation items are additional user-interface controls, not the security boundary.

### Password Reset

The password reset functionality includes:

- Secure reset token generation.
- SHA-256 hashing of reset tokens before storage.
- One-hour token expiration.
- Single-use reset tokens.
- Generic forgot-password responses to avoid revealing whether an email address exists.

---

## Real-Time Communication

ResolveHQ uses Socket.IO for real-time communication between agents and customers.

Authenticated connections join company-specific rooms.

Example room:

```text
company_<id>
```

When a ticket or conversation changes, the backend emits events to the relevant company room.

### Supported Events

| Event | Purpose |
|---|---|
| `ticket:created` | New ticket created |
| `ticket:updated` | Ticket information updated |
| `ticket:deleted` | Ticket deleted |
| `ticket:message` | New conversation message |

Clients use message IDs to prevent duplicate messages when API responses and Socket.IO broadcasts update the same conversation.

---

## SLA Management

ResolveHQ includes a configurable Service Level Agreement system.

SLA policies define response and resolution time limits according to ticket priority.

### Tracked SLA Information

- `first_response_due_at`
- `first_responded_at`
- `resolution_due_at`
- `first_response_sla_status`
- `resolution_sla_status`

### SLA Workflow

1. A ticket is created.
2. The backend retrieves the applicable SLA policy.
3. First-response and resolution deadlines are calculated.
4. When an agent sends the first response, the first-response SLA status is updated.
5. When a ticket is resolved or closed, the resolution SLA status is updated.
6. A background monitoring service checks overdue tickets.

The system uses configurable deadlines rather than hard-coded response times.

---

## Email Notifications

ResolveHQ uses a shared mailer utility located at:

```text
src/utils/mailer.js
```

The utility integrates with the Resend API and is reused by different controllers.

### Notification Workflow

| Trigger | Recipient | Notification |
|---|---|---|
| Password reset request | Agent | Password reset link |
| Customer raises a ticket | Customer | Ticket confirmation |
| Admin assigns a ticket | Assigned agent | Assignment notification |
| Agent replies to a ticket | Customer | New ticket reply notification |
| Contact form submission | Support inbox | Contact message |

Email delivery is designed to fail independently of the underlying ticket operation, so an email provider failure does not need to interrupt ticket creation or replies.

**Current limitation:** The application uses Resend's testing sender. A verified sending domain is required before unrestricted delivery to arbitrary recipients.

---

## API Reference

The following table summarizes the main API endpoints.

### Agent Authentication – `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/signup` | Public | Register company and first admin |
| POST | `/login` | Public | Agent login |
| POST | `/logout` | Public | Clear agent session |
| GET | `/me` | Agent | Get current agent profile |
| POST | `/forgotPassword` | Public | Request password reset |
| POST | `/resetPassword` | Public | Reset password |

### Customer Authentication – `/api/customer-auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/signup` | Public | Customer signup |
| POST | `/login` | Public | Customer login |
| POST | `/logout` | Public | Clear customer session |
| GET | `/me` | Customer | Get customer profile |

### Companies – `/api/companies`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List available companies |

### Tickets – `/api/tickets`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/createTickets` | Agent | Create ticket |
| GET | `/` | Agent | List accessible tickets |
| GET | `/:id` | Agent | Get ticket details |
| PATCH | `/:id` | Agent | Update ticket |
| PATCH | `/:id/assign` | Admin | Assign ticket |
| DELETE | `/:id` | Admin | Delete ticket |

### Customer Portal – `/api/customer-portal`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/tickets` | Customer | Raise a ticket |
| GET | `/tickets` | Customer | List own tickets |
| GET | `/tickets/:id` | Customer | View own ticket |
| GET | `/tickets/:id/messages` | Customer | View conversation |
| POST | `/tickets/:id/reply` | Customer | Reply to ticket |

### Customers – `/api/customer`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/create` | Agent | Create customer |
| GET | `/` | Agent | List/search customers |
| GET | `/:id` | Agent | View customer |
| GET | `/:id/tickets` | Agent | View customer's ticket history |

### Agents – `/api/agents`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/createAgent` | Admin | Create agent |
| GET | `/allAgents` | Admin | List company agents |
| PATCH | `/:id` | Admin | Update agent |

### Messages – `/api/response`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/replyMessage/:id` | Agent | Reply to ticket |
| GET | `/allMessages/:id` | Agent | Get ticket conversation |

### Statistics – `/api/stats`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/stats` | Admin | Company-wide statistics |
| GET | `/agentStats` | Agent | Agent-specific statistics |

---

## Project Structure

```text
ResolveHQ/
│
├── resolvehq-frontend/
│   ├── public/
│   └── src/
│       ├── api/                 # API modules
│       ├── components/          # Reusable UI components
│       ├── contexts/            # Authentication and toast contexts
│       ├── pages/               # Application pages
│       ├── socket.js            # Socket.IO client
│       ├── App.jsx
│       └── index.css
│
├── src/
│   ├── controllers/             # Business logic
│   ├── routes/                  # API route definitions
│   ├── middlewares/             # Authentication and authorization
│   ├── services/                # SLA and background services
│   ├── database/                # SQL schema and migrations
│   ├── utils/                   # Shared utilities
│   ├── db/
│   │   └── pool.js              # PostgreSQL connection pool
│   └── socket.js                # Socket.IO server
│
├── server.js                    # Backend entry point
├── package.json
├── package-lock.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js
- npm
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Yashk879/ResolveHQ.git

cd ResolveHQ
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Configure Backend Environment Variables

Create a `.env` file in the project root.

```env
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=resolveHQ
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password

JWT_SECRET=your_jwt_secret

FRONTEND_URL=http://localhost:5173

RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your_verified_sender
```

Use the exact database environment variable names expected by `src/db/pool.js`.

Never commit your `.env` file or expose API keys and database credentials.

### 4. Set Up the Database

Create the PostgreSQL database:

```sql
CREATE DATABASE "resolveHQ";
```

Execute the schema and required SQL migration files from:

```text
src/database/
```

Ensure the database tables, constraints, and indexes are created before starting the application.

### 5. Start the Backend

From the project root:

```bash
node server.js
```

The backend runs on port `3000` by default.

### 6. Install Frontend Dependencies

Open another terminal:

```bash
cd resolvehq-frontend

npm install
```

### 7. Configure Frontend Environment Variables

Create `resolvehq-frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

### 8. Start the Frontend

```bash
npm run dev
```

Open the development URL provided by Vite:

```text
http://localhost:5173
```

---

## Deployment

ResolveHQ is deployed using the following services:

| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| PostgreSQL Database | Neon |
| Email Service | Resend |

### Live Links

- **Application:** https://resolve-hq-one.vercel.app
- **GitHub:** https://github.com/Yashk879/ResolveHQ

---

## Security Considerations

ResolveHQ incorporates several backend security practices:

- Passwords hashed using bcrypt.
- JWT authentication stored in HTTP-only cookies.
- Separate agent and customer authentication sessions.
- Server-side role-based authorization.
- Company-scoped database queries.
- Customer ownership checks for ticket access.
- Password reset tokens stored as SHA-256 hashes.
- Single-use password reset tokens with expiration.
- CORS configured for trusted frontend origins.
- Environment variables used for sensitive configuration.

Frontend route protection is used for navigation and user experience, while actual authorization is enforced through backend middleware and controller-level access checks.

---

## Known Limitations & Roadmap

ResolveHQ is deployed and functional, but there are areas that can be improved further.

### Planned Improvements

- Automated integration tests for authentication and tenant isolation.
- CI pipeline for running tests on code changes.
- Enhanced SLA monitoring and breach verification.
- Production-ready email delivery with a verified domain.
- Ticket attachments.
- Advanced analytics and reporting.
  
---

## Engineering Concepts Demonstrated

Building ResolveHQ provided practical experience with several backend and full-stack engineering concepts.

**Backend Development**
- REST API design.
- Express middleware architecture.
- Separation of routes, controllers, and services.
- JWT authentication.
- Role-based access control.
- Environment-based configuration.
- Error handling and asynchronous operations.

**Database Engineering**
- PostgreSQL relational database design.
- Foreign keys and referential integrity.
- Composite unique constraints.
- Database indexing.
- Connection pooling.
- Tenant-aware SQL queries.
- Cascading deletes and nullable relationships.

**Frontend Development**
- React component architecture.
- React Context API.
- Protected and role-based routes.
- Axios API integration.
- Separate authentication contexts.
- Real-time UI synchronization.

**System Design**
- Multi-tenant application architecture.
- Separation of authentication domains.
- Company-scoped Socket.IO communication.
- Background SLA monitoring.
- Graceful email failure handling.
- Deployment of a distributed frontend/backend application.

---

## Author

**Yash Kumar**

B.Tech – Computer Science and Engineering

- GitHub: [Yashk879](https://github.com/Yashk879)
- LinkedIn: [Connect with me](https://www.linkedin.com/)

---

## License

Available for educational and portfolio purposes. Licensing terms may be updated as the project evolves.

---
