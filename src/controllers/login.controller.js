const pool=require("../db/pool");

const jwt=require("jsonwebtoken");

const bcrypt=require("bcrypt");

async function login(req,res){

    const{email,password}=req.body;

    try{
        if(!email || !password){
            return res.status(400).json({
                message:"Email and Password are required"
            });
        }

        const agentExists=await pool.query(
            `Select id ,company_id,name,email,password_hash,role 
            from agents 
            where email=$1`,[email]
        );

        if(agentExists.rows.length===0){
            return res.status(401).json({
                message:"Invalid Email or Password"
            });
        }

        const agent=agentExists.rows[0];

        const passwordMatch=await bcrypt.compare(
            password,agent.password_hash
        );

        if(!passwordMatch){
            return res.status(401).json({
                message:"Invalid Email or Password"
            });
        }

        const token=jwt.sign({
            agentId:agent.id,
            companyId:agent.company_id,
            role:agent.role
        },process.env.JWT_SECRET,{
            expiresIn:"1d"
        });

        res.cookie("token",token,{
            httpOnly:true,
            secure:process.env.NODE_ENV==="production",
            sameSite:"lax",
            maxAge:24*60*60*1000
        });

        return res.status(200).json({
            message:"Login Successful",
            agent:{
                id:agent.id,
                companyId:agent.company_id,
                name:agent.name,
                email:agent.email,
                role:agent.role
            }
        });
    }

    catch(err){
        console.error(err);

        return res.status(500).json({
            message:"Server Error"
        });
    }
}

async function getMe(req, res) {

    try {

        return res.status(200).json({
            message: "User authenticated",
            user: req.user
        });

    }
    catch(err) {

        console.error(err);

        return res.status(500).json({
            message: "Server Error"
        });
    }
}

async function logOut(req,res){

    try{
        res.clearCookie("token",{
            httpOnly:true,
            secure:process.env.NODE_ENV==="production",
            sameSite:"lax"
        })
        return res.status(200).json({
            message:"Logged Out Successfully"
        })
    }
    catch(err){
        console.error(err);

        return res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

module.exports={login,getMe,logOut};