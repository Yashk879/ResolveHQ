const pool=require("../db/pool")

async function replyTicket(req,res){

    const ticketId=req.params.id;
    
    const {messages}=req.body;

    const companyId=req.user.companyId;
    
    const agentId=req.user.agentId;

    try{
        if(!messages){
            return res.status(400).json({
                message:"Message is Required"
            });
        }

        const ticketResult=await pool.query(
            `select id from tickets
            where id=$1
            and company_id=$2`,
            [ticketId,companyId]
        );

        if(ticketResult.rows.length===0){
            return res.status(404).json({
                message:"Ticket Not found"
            });
        }

        const result=await pool.query(
            `INSERT into messages
            (ticket_id,sender_agent_id,messages)
            values ($1,$2,$3)
            returning id,ticket_id,sender_agent_id,messages,created_at`,
            [ticketId,agentId,messages] 
        );

        return res.status(201).json({
            message:"Reply Added Successfully",
            reply:result.rows[0]
        })
    }
    catch(err){
        console.error(err);

        return res.status(500).json({
            message:"Internal Server Error"
        })
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
            `Select id,ticket_id,sender_agent_id,messages,created_at from messages
            where ticket_id=$1
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