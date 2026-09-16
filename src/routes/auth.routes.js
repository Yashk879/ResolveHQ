const express=require("express")

const {CompanySignup}=require("../controllers/auth.controllers")

const {login,getMe,logout,forgotPassword,resetPassword}=require("../controllers/login.controller");
const requireLogin = require("../middlewares/login");

const router=express.Router();

router.post("/signup",CompanySignup);

router.post("/login",login)

router.post("/logout",logout)

router.post("/forgotPassword",forgotPassword)

router.post("/resetPassword",resetPassword);

router.get("/me",requireLogin,getMe)

module.exports=router;
