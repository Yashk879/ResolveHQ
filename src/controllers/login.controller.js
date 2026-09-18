const pool=require("../db/pool");

const jwt=require("jsonwebtoken");

const bcrypt=require("bcrypt");

const crypto=require("crypto")

const nodemailer=require("nodemailer")

const transporter=nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:process.env.GMAIL_USER,
        pass:process.env.GMAIL_APP_PASSWORD
    }
});

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
            maxAge:30*60*1000
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

async function logout(req,res){

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

async function forgotPassword(req,res){
    const {email}=req.body;

    try{
    if(!email){
        return res.status(400).json({
            message:"Email is required"
        })
    }

    const agentResult=await pool.query(
        `SELECT id,name from agents
        where email=$1`,
        [email]
    );

    if(agentResult.rows.length>0){

        const agent=agentResult.rows[0];

        const rawToken=crypto.randomBytes(32).toString("hex");
 
        const tokenHash=crypto.createHash("sha256").update(rawToken).digest("hex");
 
        const expiry=new Date(Date.now()+60*60*1000);

        await pool.query(
            `update agents
            set reset_token_hash=$1,
            reset_token_expiry=$2
            where id=$3`,
            [tokenHash,expiry,agent.id]
        )

        const resetLink=`${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

        try{
            await transporter.sendMail({
                from:process.env.GMAIL_USER,
                to:email,
                subject:"Reset Your Paasword",
                html: `<p>Hi ${agent.name},</p>
                        <p>Click the link below to reset your ResolveHQ password. This link expires in 1 hour.</p>
                        <p><a href="${resetLink}">${resetLink}</a></p>
                        <p>If you didn't request this, you can safely ignore this email.</p>`
            })
        }
        catch(emailErr){
            console.error("Failed To Send Email: ",emailErr);
        }
    }
    return res.status(200).json({
        message:"If an account with that email exists, a reset link has been sent."
    })
}
catch(err){
    console.error(err);

    return res.status(500).json({
        message:"Internal Server Error"
    })
}
}

async function resetPassword(req,res){
 
    const {token,newPassword}=req.body;
 
    try{
        if(!token || !newPassword){
            return res.status(400).json({
                message:"Token and new password are required"
            });
        }
 
        const tokenHash=crypto.createHash("sha256").update(token).digest("hex");
 
        const agentResult=await pool.query(
            `select id,reset_token_expiry from agents where reset_token_hash=$1`,
            [tokenHash]
        );
 
        if(agentResult.rows.length===0){
            return res.status(400).json({
                message:"Invalid or expired reset link"
            });
        }
 
        const agent=agentResult.rows[0];
 
        if(!agent.reset_token_expiry || new Date(agent.reset_token_expiry)<new Date()){
            return res.status(400).json({
                message:"Invalid or expired reset link"
            });
        }
         const passwordHash=await bcrypt.hash(newPassword,10);
 
        await pool.query(
            `update agents
            set password_hash=$1, reset_token_hash=null, reset_token_expiry=null
            where id=$2`,
            [passwordHash,agent.id]
        );
 
        return res.status(200).json({
            message:"Password reset successful. You can now log in."
        });
    }
    catch(err){
        console.error(err);
 
        return res.status(500).json({
            message:"Server Error"
        });
    }
}

module.exports={login,getMe,logout,forgotPassword,resetPassword};