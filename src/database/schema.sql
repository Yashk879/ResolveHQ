Create table Companies(
    id serial PRIMARY KEY,
    name varchar(200) not null,
    created_at timestamp default CURRENT_TIMESTAMP
);

Create table agents(
    id serial PRIMARY KEY,
    company_id integer not null references Companies(id) on delete cascade,
    name varchar(200) not null,
    email varchar(150) not null unique,
    password_hash text not null,
    role varchar(20) not null default 'agent',
    created_at timestamp default CURRENT_TIMESTAMP
);

Create table customers(
    id serial PRIMARY KEY,
    company_id integer not null references Companies(id) on delete cascade,
    name varchar(200) not null,
    email varchar(200) not null,
    created_at timestamp default CURRENT_TIMESTAMP,
    unique(company_id,email)
);

Create table tickets(
    id serial PRIMARY KEY,
    company_id integer not null references Companies(id) on delete cascade,
    customer_id integer not null references customers(id) on delete cascade,
    assigned_agent_id integer references agents(id) on delete set null,
    subject varchar(200) not null,
    description  text not null, 
    status varchar(20) not null default 'open',
    priority varchar(20) not null default 'medium',

    created_at timestamp default CURRENT_TIMESTAMP,
    updated_at timestamp default CURRENT_TIMESTAMP
);

Create table messages(
    id serial PRIMARY KEY,
    ticket_id integer not null references tickets(id) on delete cascade,

    sender_agent_id integer references agents(id) on delete set null,
    sender_customer_id integer references customers(id) on delete set null,

    messages text not null,
    created_at timestamp default CURRENT_TIMESTAMP
);