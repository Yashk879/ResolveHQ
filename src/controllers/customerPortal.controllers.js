const pool=require("../db/pool")

const { emitTicketEvent } = require("../socket")

async function createOwnTicket(req,res){

    const {subject,description,priority}=req.body

    const companyId=req.customer.companyId

    const customerId=req.customer.customerId

    try{
        if(!subject || !description){
            return res.status(400).json({
                message:"Subject and Description are required"
            })
        }

        const result=await pool.query(
            `INSERT into tickets (company_id,customer_id,assigned_agent_id,subject,description,priority)
            values ($1,$2,$3,$4,$5,$6)
            returning id,company_id,customer_id,assigned_agent_id,subject,description,status,priority,created_at,updated_at`,
            [companyId,customerId,null,subject,description,priority || "low"]
        )

        return res.status(201).json({
            message:"Ticket Submitted Successfully",
            ticket:result.rows[0]
        })
    }
    
    catch(err){
        console.error(err)

        return res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

async function listOwnTickets(req,res){

    const companyId=req.customer.companyId;

    const customerId=req.customer.customerId;

    try{
        const result=await pool.query(
            `SELECT id,company_id,customer_id,assigned_agent_id,subject,description,status,priority,created_at,updated_at
            from tickets
            where company_id=$1 and customer_id=$2
            order by created_at desc`,
            [companyId,customerId]
        )
        return res.status(200).json({
            tickets:result.rows
        })
    }

    catch(err){
        console.error(err);

        return res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

async function getOwnTicket(req,res){
    const ticketId=req.params.id;

    const companyId=req.customer.companyId;

    const customerId=req.customer.customerId;

    try{
        const result=await pool.query(
            `SELECT id,company_id,customer_id,assigned_agent_id,subject,description,status,priority,created_at,updated_at
            from tickets
            where id=$1 and company_id=$2 and customer_id=$3`,
            [ticketId,companyId,customerId]
        )

        if(result.rows.length===0){
            return res.status(404).json({
                message:"Ticket Not Found"
            })
        }
        return res.status(200).json({
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

async function getOwnTicketMessage(req,res){
    const ticketId=req.params.id;
 
    const companyId=req.customer.companyId;
 
    const customerId=req.customer.customerId;

    try{

        const ticketResult=await pool.query(
            `SELECT id from tickets
            where id=$1 and company_id=$2 and customer_id=$3`,
            [ticketId,companyId,customerId]
        );

        if(ticketResult.rows.length===0){
            return res.status(404).json({
                message:"Ticket Not Found"
            })
        }

        const result=await pool.query(
            `SELECT id,ticket_id,sender_agent_id,sender_customer_id,messages,created_at
            from messages
            where ticket_id=$1
            order by created_at asc`,
            [ticketId]
        )

        return res.status(200).json({
            messages:result.rows
        })
    }

    catch(err){
        console.error(err);

        return res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

async function replyToOwnTicket(req,res){
    const ticketId=req.params.id;

    const {message}=req.body

    const companyId=req.customer.companyId;

    const customerId=req.customer.customerId

    try{
        if(!message){
            return res.status(400).json({
                message:"Message is Required"
            })
        }

        const ticketResult=await pool.query(
            `SELECT id from tickets
            where id=$1 and company_id=$2 and customer_id=$3`,
            [ticketId,companyId,customerId]
        )

        if(ticketResult.rows.length===0){
            return res.status(404).json({
                message:"Ticket Not Found"
            });
        }

        const result=await pool.query(
            `insert into messages (ticket_id,sender_customer_id,messages)
            values($1,$2,$3)
            returning id,ticket_id,sender_agent_id,sender_customer_id,messages,created_at`,
            [ticketId,customerId,message]
        )

        emitTicketEvent(companyId, "ticket:message", { ticketId: Number(ticketId), message: result.rows[0] });

        return res.status(201).json({
            message:"Reply Sent Successfully",
            reply:result.rows[0]
        })
    }

    catch(err){
        console.error(err)

        return res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

module.exports={createOwnTicket,listOwnTickets,getOwnTicket,getOwnTicketMessage,replyToOwnTicket}