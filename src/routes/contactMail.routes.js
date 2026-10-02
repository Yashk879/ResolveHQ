const express=require("express")

const {contactMail}=require("../controllers/contact.controllers")

const router=express.Router();

router.post("/",contactMail)

module.exports=router