const jwt=require("jsonwebtoken")

function requireCustomerLogin(req,res,next){
    const token=req.cookies.customer_token;

    if(!token){
        return res.status(401).json({
            message:"Login Required"
        })
    }

    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET)

         if(decoded.type!=="customer"){
            return res.status(401).json({
                message:"Invalid Session"
            });
        }
 
        req.customer=decoded;
 
        next();
    }
    catch(err){
        return res.status(401).json({
            message:"Invalid or Expired Token"
        });
    }
}

module.exports=requireCustomerLogin