\
-- =========================================================
-- ResolveHQ: Multi-tenant customer support / helpdesk
-- PostgreSQL database schema
-- =========================================================

-- 1. Companies
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 2. Agents
CREATE TABLE agents (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL
    REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'agent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reset_token_hash TEXT,
    reset_token_expiry TIMESTAMP
);


-- 3. Customers
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL
    REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL,
    password_hash TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- A customer email must be unique within a company,
    -- but the same email can belong to different companies.
    UNIQUE (company_id, email)
);

-- 4. Tickets
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL
    REFERENCES companies(id) ON DELETE CASCADE,
    customer_id INTEGER NOT NULL
    REFERENCES customers(id) ON DELETE CASCADE,
    assigned_agent_id INTEGER
    REFERENCES agents(id) ON DELETE SET NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Messages
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL
    REFERENCES tickets(id) ON DELETE CASCADE,
    sender_agent_id INTEGER
    REFERENCES agents(id) ON DELETE SET NULL,
    sender_customer_id INTEGER
    REFERENCES customers(id) ON DELETE SET NULL,
    messages TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- INDEXES
-- =========================================================

-- Find agents belonging to a company
CREATE INDEX agents_company_id_idx
    ON agents(company_id);

-- Find tickets for a company, filtered by status and
-- ordered by most recently updated
CREATE INDEX tickets_company_status_updated_idx
    ON tickets(company_id, status, updated_at DESC);

-- Find tickets assigned to a particular agent
CREATE INDEX tickets_assigned_agent_id_idx
    ON tickets(assigned_agent_id);

-- Find tickets submitted by a customer, newest first
CREATE INDEX tickets_customer_created_idx
    ON tickets(customer_id, created_at DESC);

-- Load a ticket's messages in chronological order
CREATE INDEX messages_ticket_created_idx
    ON messages(ticket_id, created_at, id);

-- Support foreign-key checks when deleting agents/customers
-- whose sender references appear in messages
CREATE INDEX messages_sender_agent_id_idx
    ON messages(sender_agent_id);

CREATE INDEX messages_sender_customer_id_idx
    ON messages(sender_customer_id);