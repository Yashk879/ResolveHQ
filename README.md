# ResolveHQ

**ResolveHQ** is a full-stack, multi-tenant customer support and helpdesk platform designed to help organizations manage customers, support agents, tickets, ticket assignments, and support conversations from a centralized dashboard.

The system is designed around a **multi-tenant architecture**, where multiple companies can use the same application and database infrastructure while keeping their data logically isolated using `company_id`-based access control.

---

## Features

### Multi-Tenant Architecture

* Multiple companies can use the same application.
* Each company has its own agents, customers, tickets, and messages.
* Company-specific data is isolated using tenant-aware database queries.
* Users cannot access resources belonging to another company.

### Authentication & Authorization

* Company and administrator registration.
* Secure password hashing using bcrypt.
* JWT-based authentication.
* HTTP-only authentication cookies.
* Role-based access control.
* Admin and agent roles.
* Protected backend routes.
* Protected frontend routes.

### Ticket Management

* Create support tickets.
* View individual tickets.
* List tickets belonging to the authenticated company.
* Update ticket information.
* Assign tickets to support agents.
* Delete tickets with appropriate authorization.
* Ticket status management.
* Ticket priority management.
* Customer-ticket relationships.

### Customer Management

* Create and manage customers.
* View customer information.
* Associate customers with companies.
* Prevent duplicate customers within the same company using a composite unique constraint.

### Agent Management

* Company-specific support agents.
* Agent roles and permissions.
* Ticket assignment.
* Admin-controlled operations.

### Ticket Conversations

* Customers and support agents can exchange messages through tickets.
* Messages are associated with individual tickets.
* Sender information is maintained for agents and customers.

### Dashboard

The React frontend provides an interactive dashboard for managing:

* Tickets
* Customers
* Agents
* Ticket details
* Customer details
* Authentication
* Application statistics

### Real-Time Communication

ResolveHQ includes Socket.IO support for real-time communication and is structured to support real-time ticket and conversation updates.

---

# Tech Stack

## Frontend

* React
* React Router
* Axios
* Vite
* JavaScript
* CSS

## Backend

* Node.js
* Express.js
* REST APIs
* Socket.IO

## Database

* PostgreSQL
* Foreign Keys
* Composite Unique Constraints
* Cascading Deletes
* Connection Pooling

## Authentication & Security

* JWT
* bcrypt
* HTTP-only cookies
* Role-based authorization
* CORS
* Environment variables

---

# Architecture

ResolveHQ follows a client-server architecture:

```text
                    ┌──────────────────────┐
                    │      React Client    │
                    │                      │
                    │  Dashboard           │
                    │  Tickets             │
                    │  Customers           │
                    │  Agents              │
                    │  Authentication      │
                    └──────────┬───────────┘
                               │
                         HTTP / REST
                               │
                               ▼
                    ┌──────────────────────┐
                    │    Express Server    │
                    │                      │
                    │ Routes               │
                    │ Controllers          │
                    │ Middleware           │
                    │ Authentication       │
                    │ Authorization        │
                    └──────────┬───────────┘
                               │
                     ┌─────────┴─────────┐
                     │                   │
                     ▼                   ▼
              ┌──────────────┐    ┌──────────────┐
              │ PostgreSQL   │    │  Socket.IO   │
              │              │    │              │
              │ Companies    │    │ Real-time    │
              │ Agents       │    │ Events       │
              │ Customers    │    │              │
              │ Tickets      │    │              │
              │ Messages     │    │              │
              └──────────────┘    └──────────────┘
```

---

# Multi-Tenant Design

One of the core architectural concepts of ResolveHQ is tenant isolation.

Each company represents a tenant.

For example:

```text
Company A
│
├── Agents
├── Customers
├── Tickets
└── Messages

Company B
│
├── Agents
├── Customers
├── Tickets
└── Messages
```

All companies can use the same application and PostgreSQL database while their data remains logically separated.

Most company-owned resources contain a `company_id` that identifies the tenant they belong to.

Authenticated users receive their company information through the JWT payload. Backend middleware uses the authenticated identity to ensure that database operations are performed within the correct tenant context.

This prevents a user from simply changing an ID in an API request to access another company's data.

---

# Database Design

The PostgreSQL database currently contains the following core entities:

```text
Companies
    │
    ├────────────── Agents
    │
    ├────────────── Customers
    │                    │
    │                    └──── Tickets
    │                              │
    │                              └──── Messages
    │
    └────────────── Tickets
```

### Companies

Stores tenant/company information.

Important fields:

* `id`
* `name`
* `created_at`

### Agents

Stores support agents belonging to companies.

Important fields:

* `id`
* `company_id`
* `name`
* `email`
* `password_hash`
* `role`
* `created_at`

### Customers

Stores customers belonging to companies.

Important fields:

* `id`
* `company_id`
* `name`
* `email`
* `created_at`

A composite unique constraint is used:

```sql
UNIQUE(company_id, email)
```

This allows the same email address to exist under different companies while preventing duplicate customer records within the same company.

### Tickets

Stores customer support tickets.

Important fields:

* `id`
* `company_id`
* `customer_id`
* `assigned_agent_id`
* `subject`
* `description`
* `status`
* `priority`
* `created_at`
* `updated_at`

### Messages

Stores conversations associated with tickets.

Important fields:

* `id`
* `ticket_id`
* `sender_agent_id`
* `sender_customer_id`
* `messages`
* `created_at`

---

# Authentication Flow

ResolveHQ uses JWT-based authentication with HTTP-only cookies.

### Registration

```text
Client
   │
   ▼
Signup API
   │
   ├── Create Company
   │
   └── Create First Agent
             │
             ▼
        Assign Admin Role
```

The initial company administrator is created during company registration.

### Login

```text
User
 │
 ▼
Login API
 │
 ├── Find user
 │
 ├── Compare password using bcrypt
 │
 ├── Generate JWT
 │
 └── Store token in HTTP-only cookie
```

The JWT contains information required to identify the authenticated user and their tenant/role.

### Protected Request

```text
Client
   │
   ▼
HTTP Request
   │
   ▼
Authentication Middleware
   │
   ├── Read authentication cookie
   ├── Verify JWT
   └── Attach authenticated user
            │
            ▼
       Authorization
            │
            ▼
        Controller
            │
            ▼
        PostgreSQL
```

---

# Role-Based Access Control

ResolveHQ supports role-based authorization.

The main roles are:

### Admin

Administrators can perform privileged operations such as:

* Assign tickets
* Delete tickets
* Manage company-level resources
* Perform administrative operations

### Agent

Agents can perform normal support operations such as:

* View tickets
* Work on assigned tickets
* Update ticket information
* Communicate through ticket conversations

Authorization middleware checks the authenticated user's role before allowing protected operations.

---

# REST API

The backend exposes RESTful endpoints for the main application resources.

### Authentication

```text
POST /api/auth/signup
POST /api/auth/login
```

### Tickets

```text
POST   /api/tickets/createTickets
GET    /api/tickets
GET    /api/tickets/:id
PATCH  /api/tickets/:id
PATCH  /api/tickets/:id/assign
DELETE /api/tickets/:id
```

### Customers

Customer endpoints provide functionality for creating, listing, viewing, and managing company-specific customers.

### Agents

Agent endpoints provide functionality for managing company agents and agent-related operations.

### Messages

Message endpoints provide functionality for creating and retrieving ticket conversations.

> API paths may evolve as the application continues to develop.

---

# Project Structure

```text
ResolveHQ/
│
├── resolvehq-frontend/
│   │
│   ├── public/
│   │
│   ├── src/
│   │   ├── api/
│   │   │   ├── agents.js
│   │   │   ├── auth.js
│   │   │   ├── axios.js
│   │   │   ├── customers.js
│   │   │   ├── messages.js
│   │   │   ├── stats.js
│   │   │   └── tickets.js
│   │   │
│   │   ├── components/
│   │   │   ├── Badges.jsx
│   │   │   ├── Loading.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── TicketList.jsx
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ToastContext.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Agents.jsx
│   │   │   ├── CustomerDetails.jsx
│   │   │   ├── Customers.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── TicketDetails.jsx
│   │   │   └── Tickets.jsx
│   │   │
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── src/
│   │
│   ├── controllers/
│   │   ├── agent.controller.js
│   │   ├── auth.controllers.js
│   │   ├── customer.controller.js
│   │   ├── login.controller.js
│   │   ├── message.controllers.js
│   │   ├── stats.controllers.js
│   │   └── ticket.controllers.js
│   │
│   ├── database/
│   │   └── schema.sql
│   │
│   ├── db/
│   │   └── pool.js
│   │
│   ├── middlewares/
│   │   ├── login.js
│   │   └── requiresRole.js
│   │
│   └── routes/
│       ├── agents.routes.js
│       ├── auth.routes.js
│       ├── customer.routes.js
│       ├── messages.routes.js
│       ├── stats.routes.js
│       └── ticketRoutes.js
│
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

---

# Getting Started

## Prerequisites

Make sure you have installed:

* Node.js
* npm
* PostgreSQL
* Git

---

## 1. Clone the Repository

```bash
git clone https://github.com/Yashk879/ResolveHQ.git
cd ResolveHQ
```

---

## 2. Install Backend Dependencies

```bash
npm install
```

---

## 3. Install Frontend Dependencies

```bash
cd resolvehq-frontend
npm install
cd ..
```

---

# Environment Variables

Create a `.env` file in the project root.

Example:

```env
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=resolveHQ

JWT_SECRET=your_jwt_secret
```

If the frontend requires environment variables, create:

```text
resolvehq-frontend/.env
```

Use the variables required by the frontend configuration.

**Never commit actual credentials, database passwords, JWT secrets, API keys, or other sensitive values to GitHub.**

The repository's `.gitignore` is configured to exclude environment files.

---

# Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE resolveHQ;
```

Then execute the schema located at:

```text
src/database/schema.sql
```

The schema creates the main tables used by the application:

```text
companies
agents
customers
tickets
messages
```

---

# Running the Backend

From the project root:

```bash
npm run dev
```

or:

```bash
node server.js
```

The backend will start on the configured server port.

---

# Running the Frontend

Open another terminal:

```bash
cd resolvehq-frontend
npm run dev
```

Vite will provide the local frontend development URL.

---

# Development Workflow

The project is organized into separate layers:

```text
Routes
   ↓
Middleware
   ↓
Controllers
   ↓
Database
```

### Routes

Define API endpoints and connect them to middleware/controllers.

### Middleware

Handles cross-cutting concerns such as:

* Authentication
* Role authorization
* Request protection

### Controllers

Contain application/business logic and database operations.

### Database Layer

Uses PostgreSQL through the Node.js `pg` package and connection pooling.

---

# Security Considerations

ResolveHQ implements several security-oriented practices:

* Passwords are hashed using bcrypt rather than stored as plaintext.
* JWT authentication is used for authenticated sessions.
* Authentication tokens are stored in HTTP-only cookies.
* Protected routes require authentication.
* Role-based authorization prevents unauthorized administrative actions.
* Tenant-aware queries are used to isolate company data.
* Environment variables are used for secrets and database credentials.
* `.env` files are excluded from version control.

---

# Data Integrity

The PostgreSQL schema uses relational constraints to maintain data consistency.

Examples include:

### Foreign Keys

Resources are connected using foreign keys such as:

```text
agents → companies
customers → companies
tickets → companies
tickets → customers
tickets → agents
messages → tickets
```

### Cascade Delete

Company-owned records use appropriate cascading behavior where required.

For example, deleting a company can cascade to dependent company-owned records.

### Set Null

Some relationships use `ON DELETE SET NULL` so that deleting an assigned agent or sender does not necessarily delete the associated ticket/message.

---

# Key Engineering Concepts Demonstrated

ResolveHQ was designed to demonstrate practical backend and full-stack engineering concepts rather than only basic CRUD functionality.

### Backend Engineering

* REST API design
* Express middleware
* Controllers and routes
* Authentication middleware
* Role-based authorization
* Database connection pooling
* Error handling
* Environment configuration
* Cookie-based authentication

### Database Engineering

* PostgreSQL
* Relational database design
* Foreign keys
* Composite unique constraints
* Cascading deletes
* Referential integrity
* Tenant-aware data access

### Frontend Engineering

* React components
* React Router
* Context API
* Protected routes
* API abstraction using Axios
* State management
* Dashboard-based UI

### System Design

* Multi-tenant architecture
* Separation of concerns
* Client-server architecture
* Authentication/authorization flow
* Real-time communication architecture

---

# Future Improvements

Planned improvements include:

* More extensive real-time ticket updates with Socket.IO
* Redis-based caching
* Background jobs using BullMQ
* Email notifications
* Advanced ticket filtering and search
* Pagination and optimized database queries
* File attachments
* Audit logging
* More granular permission management
* Automated testing
* API documentation
* Production deployment and monitoring
* Rate limiting
* Improved observability and logging

---

# Project Goals

The primary goals of ResolveHQ are to:

1. Build a realistic production-style SaaS application.
2. Demonstrate multi-tenant backend architecture.
3. Implement secure authentication and authorization.
4. Build a complete REST API.
5. Integrate a React frontend with the backend.
6. Implement real-time communication capabilities.
7. Apply software engineering principles to a practical business problem.

---

# Learning Outcomes

Building ResolveHQ provided practical experience with:

* Node.js and Express
* React
* PostgreSQL
* REST APIs
* JWT authentication
* bcrypt password hashing
* HTTP-only cookies
* RBAC
* Middleware architecture
* SQL database relationships
* Multi-tenant architecture
* API integration
* Socket.IO
* Full-stack application architecture

---

# Author

**Yash Kumar**

GitHub:
https://github.com/Yashk879

---

# License

This project is currently available for educational and portfolio purposes.

The licensing terms may be updated as the project evolves.
