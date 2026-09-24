const pool=require("../db/pool")

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

module.exports={createOwnTicket,listOwnTickets}