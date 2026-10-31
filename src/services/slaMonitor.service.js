
const pool = require("../db/pool");
const { emitTicketEvent } = require("../socket");

async function checkSlaBreaches() {
    try {
        // Check first-response SLA breaches.
        const firstResponseResult = await pool.query(
            `UPDATE tickets
             SET first_response_sla_status = 'breached'
             WHERE first_responded_at IS NULL
             AND first_response_due_at <= NOW()
             AND first_response_sla_status = 'pending'
             AND status NOT IN ('resolved', 'closed')
             RETURNING *`
        );

        // Check resolution SLA breaches.
        const resolutionResult = await pool.query(
            `UPDATE tickets
             SET resolution_sla_status = 'breached'
             WHERE resolution_due_at <= NOW()
             AND resolution_sla_status = 'pending'
             AND status NOT IN ('resolved', 'closed')
             RETURNING *`
        );

        // Emit real-time updates.
        for (const ticket of firstResponseResult.rows) {
            emitTicketEvent(
                ticket.company_id,
                "ticket:updated",
                ticket
            );
        }

        for (const ticket of resolutionResult.rows) {
            emitTicketEvent(
                ticket.company_id,
                "ticket:updated",
                ticket
            );
        }

        console.log(
            `SLA Monitor: ${firstResponseResult.rowCount} first-response breaches, ${resolutionResult.rowCount} resolution breaches`
        );

    } catch (err) {
        console.error("SLA Monitor Error:", err);
    }
}

module.exports = { checkSlaBreaches };
