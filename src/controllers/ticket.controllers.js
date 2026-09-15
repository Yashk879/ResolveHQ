const pool=require("../db/pool")

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
                companyId,customerId,agentId,subject,description,priority || "medium"
            ]
        );

        return res.status(201).json({
            message:"Ticket Created Successfully",
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
            `Select id
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

        const agentResult=await pool.query(
            `SELECT id from agents
            where id=$1
            and company_id=$2`,
            [agentId,companyId]
        )

        if(agentResult.rows.length===0){
            return res.status(404).json({
                message:"Agent Not Found"
            });
        }

        const result=await pool.query(
            `UPDATE tickets set assigned_agent_id=$1
            where id=$2
            and company_id=$3
            returning id,company_id,assigned_agent_id`,
            [agentId,ticketId,companyId]
        );

        return res.status(200).json({
            message:"Ticket Assigned Succesfully",
            ticket:result.rows[0]
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
            `SELECT id,company_id,assigned_agent_id,subject,description,status,priority,created_at,updated_at
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

async function updateTicket(req,res){

    const ticketId=req.params.id;

    const{status,priority}=req.body;

    const validStatus=[
        "open","in_progress","resolved","closed"
    ];

    if(status && !validStatus.includes(status)){
        return res.status(400).json({
            message:"Invalid Status"
        })
    }

    const validPriority=[
        "low","medium","high"
    ];

    if(priority && !validPriority.includes(priority)){
        return res.status(400).json({
            message:"Invalid Priority"
        })
    }

    const agentId=req.user.agentId;

    const companyId=req.user.companyId;

    const role=req.user.role;

    try{
        if(!status && !priority){
            return res.status(400).json({
                message:"Status and Priority are Required"
            });
        }

        let ticketResult;

        if(role==="admin"){

            ticketResult=await pool.query(
                `SELECT id from tickets
                where id=$1
                and company_id=$2`,
                [ticketId,companyId]
            )
        }

        else{
            ticketResult=await pool.query(
                `SELECT id from tickets
                where id=$1
                and company_id=$2
                and assigned_agent_id=$3`,
                [ticketId,companyId,agentId]
            )
        }

        if(ticketResult.rows.length===0){
            return res.status(404).json({
                message:"Ticket Not Found"
            });
        }

        const result=await pool.query(
            `UPDATE tickets
            set status=COALESCE($1,status),
            priority=COALESCE($2,priority),
            updated_at=NOW()
            where id=$3
            and company_id=$4
            returning id,company_id,assigned_agent_id,status,priority,updated_at`,
            [status,priority,ticketId,companyId]
        );

        return res.status(200).json({
            message:"Ticket Updated Successfully",
            ticket:result.rows[0]
        })
    }

    catch(err){
        console.error(err);

        return res.status(500).json({
            message:"Internal Server Error"
        })
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

        return res.status(200).json({
            message:"Ticket Deleted Successfully",
            id:result.rows[0].id
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