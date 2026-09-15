const pool=require("../db/pool")

async function adminTicketStats(req,res){
    const companyId=req.user.companyId

    try{
        const result=await pool.query(
            `SELECT
            count(*) as Total,
            count(*) filter (where status='open') as Open,
            count(*) filter (where status='In_Progress') as In_Progress,
            count(*) filter (where status='resolved') as Resolved,
            count(*) filter (where status='closed') as Closed
            from tickets
            where company_id=$1`,
            [companyId]
        )

        return res.status(200).json({
            totalTickets:result.rows[0].total,
            open:result.rows[0].open,
            inProgress:result.rows[0].in_progress,
            resolved:result.rows[0].resolved,
            closed:result.rows[0].closed
        })
    }

    catch(err){
        console.error(err);

        return res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

async function agentTicketStats(req,res){

    const companyId=req.user.companyId
    const agentId=req.user.agentId

    try{
        const result=await pool.query(
            `SELECT count(*) as Total,
            count(*) filter (where status='open') as Open,
            count(*) filter (where status='In_Progress') as In_Progress,
            count(*) filter (where status='resolved') as Resolved,
            count(*) filter (where status='closed') as Closed
            from tickets
            where company_id=$1
            and assigned_agent_id=$2`,
            [companyId,agentId]
        );

        return res.status(200).json({
            totalTickets:result.rows[0].total,
            open:result.rows[0].open,
            inProgress:result.rows[0].in_progress,
            resolved:result.rows[0].resolved,
            closed:result.rows[0].closed
        })
    }
    catch(err){
        console.error(err);

        return res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

module.exports={adminTicketStats,agentTicketStats}