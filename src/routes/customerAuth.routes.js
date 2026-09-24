const express=require("express")

const router=express.Router();

const {customerSignup,customerLogin,customerLogout,getCustomerMe}=require("../controllers/companyAuth.controllers")

const requireCustomerLogin=require("../middlewares/requireCustomerLogin")

router.post("/signup",customerSignup)

router.post("/login",customerLogin)

router.post("/logout",customerLogout)

router.get("/me",requireCustomerLogin,getCustomerMe)

module.exports=router