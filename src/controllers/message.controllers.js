const pool=require("../db/pool")
const { emitTicketEvent } = require("../socket")

async function replyTicket(req, res) {
    const ticketId = req.params.id;
    const { messages } = req.body;
    const companyId = req.user.companyId;
    const agentId = req.user.agentId;

    try {
        if (!messages || !messages.trim()) {
            return res.status(400).json({
                message: "Message is Required"
            });
        }

        const ticketResult = await pool.query(
            `SELECT id FROM tickets
             WHERE id = $1 AND company_id = $2`,
            [ticketId, companyId]
        );

        if (ticketResult.rows.length === 0) {
            return res.status(404).json({
                message: "Ticket Not Found"
            });
        }

        const result = await pool.query(
            `INSERT INTO messages
             (ticket_id, sender_agent_id, messages)
             VALUES ($1, $2, $3)
             RETURNING id, ticket_id, sender_agent_id,
                       messages, created_at`,
            [ticketId, agentId, messages]
        );

        const newMessage = result.rows[0];

        // Record the first agent response only once.
        const slaResult = await pool.query(
            `UPDATE tickets
             SET first_responded_at = NOW(),
                 first_response_sla_status =
                     CASE
                         WHEN NOW() <= first_response_due_at
                         THEN 'met'
                         ELSE 'breached'
                     END,
                 updated_at = NOW()
             WHERE id = $1
               AND company_id = $2
               AND first_responded_at IS NULL
               AND first_response_due_at IS NOT NULL
             RETURNING *`,
            [ticketId, companyId]
        );

        if (slaResult.rows.length > 0) {
            emitTicketEvent(
                companyId,
                "ticket:updated",
                slaResult.rows[0]
            );
        }

        emitTicketEvent(
            companyId,
            "ticket:message",
            {
                ticketId: Number(ticketId),
                message: newMessage
            }
        );

        return res.status(201).json({
            message: "Reply Added Successfully",
            reply: newMessage
        });

    } catch (err) {
        console.error("Reply Ticket Error:", err);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}


async function allTickets(req,res){

    const ticketId=req.params.id;
   
    const companyId=req.user.companyId;

    try{
        const ticketResult=await pool.query(
            `SELECT id from tickets
            where id=$1 and
            company_id=$2`,
            [ticketId,companyId]
        );

        if(ticketResult.rows.length===0){
            return res.status(404).json({
                message:"Ticket Not Found"
            });
        }

        const result=await pool.query(
            `Select m.id,m.ticket_id,m.sender_agent_id,m.messages,m.created_at, a.name as agent_name,c.name as customer_name from messages m
            left join agents a
            on
            m.sender_agent_id=a.id
            left join customers c
            on m.sender_customer_id=c.id
            where m.ticket_id=$1
            order by created_at ASC`,
            [ticketId]
        );
        return res.status(200).json({
            message:result.rows
        });
    }
    catch(err){
        console.error(err);

        return res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

module.exports={replyTicket,allTickets}
