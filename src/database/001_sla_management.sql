-- 1. Company-specific SLA policies
CREATE TABLE IF NOT EXISTS sla_policies (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id)
        ON DELETE CASCADE,
    priority VARCHAR(20) NOT NULL,
    first_response_minutes INTEGER NOT NULL
        CHECK (first_response_minutes > 0),
    resolution_minutes INTEGER NOT NULL
        CHECK (resolution_minutes > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (company_id, priority)
);

-- 2. SLA tracking on each ticket
ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS first_response_due_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS first_responded_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS resolution_due_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS first_response_sla_status
        VARCHAR(20) NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS resolution_sla_status
        VARCHAR(20) NOT NULL DEFAULT 'pending';

-- 3. Indexes for background SLA checks
CREATE INDEX IF NOT EXISTS idx_tickets_first_response_sla
    ON tickets (first_response_due_at)
    WHERE first_response_sla_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_tickets_resolution_sla
    ON tickets (resolution_due_at)
    WHERE resolution_sla_status = 'pending';