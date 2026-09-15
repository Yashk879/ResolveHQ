const jwt=require("jsonwebtoken")

function requireLogin(req,res,next){

    const token=req.cookies.token;

    if(!token){
        return res.status(401).json({
            message:"Login Required"
        });
    }
    try{
        const decoded=jwt.verify(
            token,process.env.JWT_SECRET
        );

        req.user=decoded;

        next();
    }
    catch(err){
        return res.status(401).json({
            message:"Invalid or Expired Token"
        });
    }
}

module.exports=requireLogin;