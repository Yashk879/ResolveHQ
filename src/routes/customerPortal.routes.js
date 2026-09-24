const express=require("express")

const router=express.Router();

const {createOwnTicket,listOwnTickets}=require("../controllers/customerPortal.controllers")

const requireCustomerLogin=require("../middlewares/requireCustomerLogin")

router.post("/tickets",requireCustomerLogin,createOwnTicket)

router.post("/tickets",requireCustomerLogin,listOwnTickets)

module.exports=router