const express=require("express")

const router=express.Router();

const {createOwnTicket,listOwnTickets,getOwnTicket,getOwnTicketMessage,replyToOwnTicket}=require("../controllers/customerPortal.controllers")

const requireCustomerLogin=require("../middlewares/requireCustomerLogin")

router.post("/tickets",requireCustomerLogin,createOwnTicket)

router.get("/tickets",requireCustomerLogin,listOwnTickets)

router.get("/tickets/:id",requireCustomerLogin,getOwnTicket)

router.get("/tickets/:id/messages",requireCustomerLogin,getOwnTicketMessage)

router.post("/tickets/:id/reply",requireCustomerLogin,replyToOwnTicket)

module.exports=router