
const pool = require("../db/pool");

async function applySlaToTicket(
    ticketId,
    companyId,
    priority,
    db = pool
) {
    // 1. Check the database connection.
    const dbInfo = await db.query(`
        SELECT
            current_database() AS database,
            current_user AS db_user,
            inet_server_addr() AS server_address
    `);

    console.log("SLA database connection:", dbInfo.rows[0]);

    console.log("SLA lookup parameters:", {
        companyId,
        priority
    });

    // 2. Find the company's SLA policy.
    const policyResult = await db.query(
        `SELECT
            company_id,
            priority,
            first_response_minutes,
            resolution_minutes
         FROM sla_policies
         WHERE company_id = $1
         AND priority = $2`,
        [companyId, priority]
    );

    console.log("SLA policy lookup result:", policyResult.rows);

    if (policyResult.rows.length === 0) {
        throw new Error(
            `No SLA policy found for company ${companyId} and priority ${priority}`
        );
    }

    const policy = policyResult.rows[0];

    // 3. Update ticket SLA deadlines.
    const result = await db.query(
        `UPDATE tickets
         SET
            first_response_due_at =
                CASE
                    WHEN first_responded_at IS NULL
                    THEN NOW() + ($3 * INTERVAL '1 minute')
                    ELSE first_response_due_at
                END,

            resolution_due_at =
                CASE
                    WHEN status NOT IN ('resolved', 'closed')
                    THEN NOW() + ($4 * INTERVAL '1 minute')
                    ELSE resolution_due_at
                END

         WHERE id = $1
         AND company_id = $2

         RETURNING
            id,
            first_response_due_at,
            first_responded_at,
            first_response_sla_status,
            resolution_due_at,
            resolution_sla_status`,
        [
            ticketId,
            companyId,
            policy.first_response_minutes,
            policy.resolution_minutes
        ]
    );

    if (result.rows.length === 0) {
        throw new Error(
            `Ticket ${ticketId} not found for company ${companyId}`
        );
    }

    return result.rows[0];
}

module.exports = { applySlaToTicket };
