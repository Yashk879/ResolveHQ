CREATE TABLE IF NOT EXISTS faqs (
    id SERIAL PRIMARY KEY,

    company_id INTEGER NOT NULL
        REFERENCES companies(id)
        ON DELETE CASCADE,

    question TEXT NOT NULL,
    answer TEXT NOT NULL,

    category VARCHAR(100),

    is_published BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster company-specific FAQ retrieval
CREATE INDEX IF NOT EXISTS idx_faqs_company
ON faqs(company_id);

-- Index for published FAQ filtering
CREATE INDEX IF NOT EXISTS idx_faqs_published
ON faqs(company_id, is_published);
