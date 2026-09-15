const pool=require("../db/pool")

const bcrypt=require("bcrypt")

async function createAgent(req,res){

    const {name,email,password}=req.body;

    const companyId=req.user.companyId;

    try{
        if(!name || !email || !password){
            return res.status(400).json({
                message:"Name, Email and Password are Required"
            });
        }

        const existingAgent=await pool.query(
            `SELECT id
            from agents
            where email=$1`,
            [email]
        )

        if(existingAgent.rows.lenght>0){
            return res.status(409).json({
                message:"Agent Already Exists"
            })
        }

        const passwordHash=await bcrypt.hash(password,10);

        const result=await pool.query(
            `INSERT into agents
            (company_id,name,email,password_hash,role)
            values($1,$2,$3,$4,$5)
            returning id,company_id,name,email,role,created_at`,
            [companyId,name,email,passwordHash,"agent"]
        )

        return res.status(201).json({
            message:"Agent Created Successfully",
            agent:result.rows[0]
        });
    }

    catch(err){
        console.error(err);
        return res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

async function allAgents(req,res){
    const companyId=req.user.companyId;

    try{
        const result=await pool.query(
            `SELECT id,company_id,name,email,role,created_at
            from agents
            where company_id=$1
            order by id`,
            [companyId]
        )

        return res.status(200).json({
            message:"All Agents are Fetched Successfully",
            agents:result.rows
        })
    }
    catch(err){
        console.error(err);

        return res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

async function updateAgent(req,res){

    const agentId=req.params.id;

    const {name,role}=req.body;

    const companyId=req.user.companyId;

    const validRoles=["admin","agent"];

    if(role && !validRoles.includes(role)){
        return res.status(400).json({
            message:"Invalid Role"
        });
    }

     try{
        if(!name && !role){
            return res.status(400).json({
                message:"Name or Role is Required"
            });
        }
 
        const agentResult=await pool.query(
            `SELECT id from agents
            where id=$1
            and company_id=$2`,
            [agentId,companyId]
        );
 
        if(agentResult.rows.length===0){
            return res.status(404).json({
                message:"Agent Not Found"
            });
        }
 
        const result=await pool.query(
            `UPDATE agents
            set name=COALESCE($1,name),
            role=COALESCE($2,role)
            where id=$3
            and company_id=$4
            returning id,company_id,name,email,role,created_at`,
            [name,role,agentId,companyId]
        );
 
        return res.status(200).json({
            message:"Agent Updated Successfully",
            agent:result.rows[0]
        });
    }
    catch(err){
        console.error(err);
 
        return res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

module.exports={createAgent,allAgents,updateAgent}