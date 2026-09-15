const express=require("express")

const router=express.Router();

const {replyTicket}=require("../controllers/message.controllers")

const {allTickets}=require("../controllers/message.controllers")

const requiredLogin=require("../middlewares/login")

router.post("/replyMessage/:id",requiredLogin,replyTicket)

router.get("/allMessages/:id",requiredLogin,allTickets)

module.exports=router