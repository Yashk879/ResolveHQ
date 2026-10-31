const pool=require("../db/pool")
const {sendMail}=require("../utils/mailer")
const { emitTicketEvent } = require("../socket")
const { applySlaToTicket } = require("../services/sla.service");

async function createTicket(req,res){

    const{customerId,subject,description,priority}=req.body;

    const companyId=req.user.companyId;
    
    const agentId=req.user.agentId;

    try{
        if(!customerId || !subject || !description){
            return res.status(400).json({
                message:"CustomerId, Subject and Description are Required"
            });
        }

        const result=await pool.query(
            `insert into tickets
            (company_id,customer_id,assigned_agent_id,subject,description,priority)
            values ($1,$2,$3,$4,$5,$6)
            returning id,company_id,customer_id,assigned_agent_id,subject,description,status,priority,created_at,updated_at`,
            [
                companyId,customerId,agentId,subject,description,priority || "low"
            ]
        );

        const newTicket = result.rows[0];
        const sla = await applySlaToTicket(
            newTicket.id,
            companyId,
            newTicket.priority
        );
        newTicket.first_response_due_at = sla.first_response_due_at;
        newTicket.resolution_due_at = sla.resolution_due_at;
        
        emitTicketEvent(companyId, "ticket:created", newTicket);

        return res.status(201).json({
            message:"Ticket Created Successfully",
            ticket:newTicket
        })
    }
    
    catch(err){
        console.error(err);

        return res.status(500).json({
            message:"Internal Server Error"
        });
    }
}

async function assignTicket(req,res){
    const ticketId=req.params.id;

    const {agentId}=req.body;

    const companyId=req.user.companyId;

    try{
        if(!agentId){
            return res.status(400).json({
                message:"Agent ID is Required"
            });
        }

        const ticketResult=await pool.query(
            `Select id,subject
            from tickets
            where id=$1 and
            company_id=$2`,
            [ticketId,companyId]
        );

        if(ticketResult.rows.length===0){
            return res.status(404).json({
                message:"Ticket Not Found"
            });
        }

        const ticket=ticketResult.rows[0]

        const agentResult=await pool.query(
            `SELECT id,name,email from agents
            where id=$1
            and company_id=$2`,
            [agentId,companyId]
        )

        if(agentResult.rows.length===0){
            return res.status(404).json({
                message:"Agent Not Found"
            });
        }

        const agentInfo=agentResult.rows[0]

        const result=await pool.query(
            `UPDATE tickets set assigned_agent_id=$1, updated_at=NOW()
            where id=$2
            and company_id=$3
            returning id,company_id,customer_id,assigned_agent_id,subject,description,status,priority,created_at,updated_at`,
            [agentId,ticketId,companyId]
        );

        const updatedTicket = result.rows[0];
        emitTicketEvent(companyId, "ticket:updated", updatedTicket);

        try{await sendMail(
            agentInfo.email,
            "A new Ticket has been assigned to you - ResolveHQ",
            `
             <p>Hi ${agentInfo.name},</p>
            <p>The ticket <strong>"${ticket.subject}"
            </strong> has been assigned to you.</p>
            <p>Log in to ResolveHQ to view and respond to it.</p>
            `
        )
    }
    catch(mailError){
        console.error("Assignment email failed:",mailError)
    }

        return res.status(200).json({
            message:"Ticket Assigned Succesfully",
            ticket:updatedTicket
        });
    }

    catch(err){
        console.error(err);

        return res.status(500).json({
            message:"Internal Server Error"
        });
    }
}

async function listTickets(req,res){
    
    const page=parseInt(req.query.page) || 1;

    const limit=parseInt(req.query.limit) || 10;
    
    const offset=(page-1)*limit;
    
    const companyId=req.user.companyId;

    const agentId=req.user.agentId;
    
    const role=req.user.role;

    const status=req.query.status

    const priority=req.query.priority

    const search=req.query.search;

    const validStatus=[
    "open","in_progress","resolved","closed"];

    const validPriority=[
    "low","medium","high"];

    if(status && !validStatus.includes(status)){
    return res.status(400).json({
        message:"Invalid Status"
    });
}

    if(priority && !validPriority.includes(priority)){
        return res.status(400).json({
            message:"Invalid Priority"
        })
    }

    try{
        let result;

        if(role==="admin"){

            if(status && priority && search){
                result=await pool.query(
                    `SELECT * from tickets
                    where company_id=$1
                    and status=$2
                    and priority=$3
                    and subject ILIKE $4
                    order by created_at desc
                    limit $5 offset $6`,
                    [companyId,status,priority,`%${search}%`,limit,offset]
                )
            }

            else if(status && priority){
                
            result=await pool.query(
            `select 
            id,company_id,customer_id,assigned_agent_id,subject,description,status,priority,created_at,updated_at
            from tickets
            where company_id=$1
            and status=$2
            and priority=$3
            order by created_at desc
            limit $4 offset $5`,
            [companyId,status,priority,limit,offset]
        );
    }

    else if(search && status){
        result=await pool.query(
            `SELECT id,company_id,customer_id,assigned_agent_id,subject,description,status,priority,created_at,updated_at
            from tickets
            where company_id=$1
            and subject ILIKE $2
            and status=$3
            order by created_at desc
            limit $4 offset $5`,
            [companyId,`%${search}%`,status,limit,offset]
        )
    }

    else if(status){
        result=await pool.query(
            `SELECT
            id,company_id,customer_id,assigned_agent_id,
            subject,description,status,priority,created_at,updated_at
            FROM tickets
            WHERE company_id=$1
            AND status=$2
            ORDER BY created_at DESC
            LIMIT $3 OFFSET $4`,
            [companyId,status,limit,offset]
        );
    }

    else if(priority && search){
        result=await pool.query(
         `SELECT
        id,company_id,customer_id,assigned_agent_id,
        subject,description,status,priority,created_at,updated_at
        FROM tickets
        WHERE company_id=$1
        AND priority=$2
        AND subject ILIKE $3
        ORDER BY created_at DESC
        LIMIT $4 OFFSET $5`,
        [companyId,priority,`%${search}%`,limit,offset]
    );

    if(result.rows.length===0){
        return res.status(404).json({
            message:"Ticket Not Found"
        })
    }
}

    else if(priority){

        result=await pool.query(
            `SELECT
            id,company_id,customer_id,assigned_agent_id,
            subject,description,status,priority,created_at,updated_at
            FROM tickets
            WHERE company_id=$1
            AND priority=$2
            ORDER BY created_at DESC
            LIMIT $3 OFFSET $4`,
            [companyId,priority,limit,offset]
        );
    }

    else if(search){
        result=await pool.query(
            `SELECT id,company_id,customer_id,assigned_agent_id,subject,description,status,priority,created_at,updated_at
            from tickets
            where company_id=$1
            and subject ILIKE $2
            order by created_at desc
            limit $3 offset $4`,
            [companyId,`%${search}%`,limit,offset]
        )
    }

    else{
        result=await pool.query(
            `SELECT id,company_id,customer_id,assigned_agent_id,subject,description,status,priority,created_at,updated_at
            from tickets
            where company_id=$1
            order by created_at desc
            limit $2 offset $3`,
            [companyId,limit,offset]
        )
    }
}

    else{
        if(status && priority && search){

    result=await pool.query(
        `SELECT *
        FROM tickets
        WHERE company_id=$1
        AND status=$2
        AND priority=$3
        AND subject ILIKE $4
        AND assigned_agent_id=$5
        ORDER BY created_at DESC
        LIMIT $6 OFFSET $7`,
        [companyId,status,priority,`%${search}%`,agentId,limit,offset]
    );

}
        else if(status && priority){
    result=await pool.query(
        `SELECT * from tickets
        where company_id=$1 
        and status=$2
        and priority=$3
        and assigned_agent_id=$4
        order by created_at desc
        limit $5 offset $6`,
        [companyId,status,priority,agentId,limit,offset]
    );
}

else if(status && search){

    result=await pool.query(
        `SELECT *
        FROM tickets
        WHERE company_id=$1
        AND status=$2
        AND subject ILIKE $3
        AND assigned_agent_id=$4
        ORDER BY created_at DESC
        LIMIT $5 OFFSET $6`,
        [companyId,status,`%${search}%`,agentId,limit,offset]
    );
}

else if(status){

        result=await pool.query(
            `SELECT *
            FROM tickets
            WHERE company_id=$1
            AND status=$2
            AND assigned_agent_id=$3
            ORDER BY created_at DESC
            LIMIT $4 OFFSET $5`,
            [companyId,status,agentId,limit,offset]
        );
    }

    else if(priority && search){
    result=await pool.query(
        `SELECT *
        FROM tickets
        WHERE company_id=$1
        AND priority=$2
        AND subject ILIKE $3
        AND assigned_agent_id=$4
        ORDER BY created_at DESC
        LIMIT $5 OFFSET $6`,
        [companyId,priority,`%${search}%`,agentId,limit,offset]
    );
}

    else if(priority){

        result=await pool.query(
            `SELECT *
            FROM tickets
            WHERE company_id=$1
            AND priority=$2
            AND assigned_agent_id=$3
            ORDER BY created_at DESC
            LIMIT $4 OFFSET $5`,
            [companyId,priority,agentId,limit,offset]
        );
    }

    else if(search){
    result=await pool.query(
        `SELECT *
        FROM tickets
        WHERE company_id=$1
        AND subject ILIKE $2
        AND assigned_agent_id=$3
        ORDER BY created_at DESC
        LIMIT $4 OFFSET $5`,
        [companyId,`%${search}%`,agentId,limit,offset]
    );
}

else{
    result=await pool.query(
        `SELECT *
        FROM tickets
        where company_id=$1
        and assigned_agent_id=$2
        order by created_at desc
        limit $3 offset $4`,
        [companyId,agentId,limit,offset]
    );
}
}

return res.status(200).json({
    page,
    limit,
    tickets:result.rows
})
    }

catch(err){
    console.error(err);

    return res.status(500).json({
        message:"Internal Sever Error"
    })
}
    }

async function getTicket(req,res){

    const ticketId=req.params.id;

    const companyId=req.user.companyId

    try{
        const result=await pool.query(
            `select
            id,company_id,customer_id,assigned_agent_id,subject,description,status,priority,created_at,updated_at
            from tickets
            where id=$1
            and company_id=$2`,
            [ticketId,companyId]
        );

        if(result.rows.length==0){
            return res.status(404).json({
                message:"Ticket Not Found"
            });
        }

        return res.status(200).json({
            ticket:result.rows[0]
        })
    }

    catch(err){
        console.error(err);

        return res.status(500).json({
            message:"Internal Server Error"
        });
    }
}


async function updateTicket(req, res) {
    const ticketId = req.params.id;
    const { status, priority } = req.body;

    const validStatus = [
        "open", "in_progress", "resolved", "closed"
    ];

    const validPriority = [
        "low", "medium", "high"
    ];

    if (status && !validStatus.includes(status)) {
        return res.status(400).json({
            message: "Invalid Status"
        });
    }

    if (priority && !validPriority.includes(priority)) {
        return res.status(400).json({
            message: "Invalid Priority"
        });
    }

    const agentId = req.user.agentId;
    const companyId = req.user.companyId;
    const role = req.user.role;

    const client = await pool.connect();

    try {
        if (!status && !priority) {
            return res.status(400).json({
                message: "Status and Priority are Required"
            });
        }

        await client.query("BEGIN");

        // 1. Find ticket and check authorization
        let ticketResult;

        if (role === "admin") {
            ticketResult = await client.query(
                `SELECT id, priority, status
                 FROM tickets
                 WHERE id = $1
                 AND company_id = $2
                 FOR UPDATE`,
                [ticketId, companyId]
            );
        } else {
            ticketResult = await client.query(
                `SELECT id, priority, status
                 FROM tickets
                 WHERE id = $1
                 AND company_id = $2
                 AND assigned_agent_id = $3
                 FOR UPDATE`,
                [ticketId, companyId, agentId]
            );
        }

        if (ticketResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Ticket Not Found"
            });
        }

        const existingTicket = ticketResult.rows[0];

        // 2. Update ticket
        const result = await client.query(
            `UPDATE tickets
             SET status = COALESCE($1, status),
                 priority = COALESCE($2, priority),
                 updated_at = NOW()
             WHERE id = $3
             AND company_id = $4
             RETURNING *`,
            [status, priority, ticketId, companyId]
        );

        let updatedTicket = result.rows[0];

        // Mark resolution SLA when ticket is resolved or closed.

// Mark Resolution SLA only when the ticket is resolved
// or closed for the first time.
if (
    status &&
    ["resolved", "closed"].includes(status) &&
    !["resolved", "closed"].includes(existingTicket.status)
) {
    const resolutionResult = await client.query(
        `UPDATE tickets
         SET resolution_sla_status =
             CASE
                 WHEN NOW() <= resolution_due_at THEN 'met'
                 ELSE 'breached'
             END
         WHERE id = $1
           AND company_id = $2
           AND resolution_sla_status = 'pending'
           AND resolution_due_at IS NOT NULL
         RETURNING resolution_sla_status`,
        [ticketId, companyId]
    );

    if (resolutionResult.rows.length > 0) {
        updatedTicket.resolution_sla_status =
            resolutionResult.rows[0].resolution_sla_status;
    }
}
        // 3. Recalculate SLA only if priority changed
        if (
            priority &&
            priority !== existingTicket.priority
        ) {
            const sla = await applySlaToTicket(
                ticketId,
                companyId,
                updatedTicket.priority,
                client
            );

            updatedTicket = {
                ...updatedTicket,
                ...sla
            };
        }

        // 4. Commit transaction
        await client.query("COMMIT");

        // 5. Emit event after successful commit
        emitTicketEvent(
            companyId,
            "ticket:updated",
            updatedTicket
        );

        return res.status(200).json({
            message: "Ticket Updated Successfully",
            ticket: updatedTicket
        });

    } catch (err) {
        await client.query("ROLLBACK");

        console.error("Update Ticket Error:", err);

        return res.status(500).json({
            message: "Internal Server Error"
        });

    } finally {
        client.release();
    }
}


async function deleteTicket(req,res){

    const ticketId=req.params.id;

    const companyId=req.user.companyId

    try{
        const result=await pool.query(
            `DELETE from tickets
             where id=$1
             and company_id=$2
             returning id`,
             [ticketId,companyId]
        )

        if(result.rows.length===0){
            return res.status(404).json({
                message:"Ticket Not Found"
            })
        }

        const deletedId = result.rows[0].id;
        emitTicketEvent(companyId, "ticket:deleted", { id: Number(deletedId), company_id: companyId });

        return res.status(200).json({
            message:"Ticket Deleted Successfully",
            id:deletedId
        })
    }
    catch(err){
        console.error(err);

        return res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

module.exports={createTicket,assignTicket,getTicket,listTickets,updateTicket,deleteTicket}
