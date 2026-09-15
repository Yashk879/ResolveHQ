const express=require("express")

const router=express.Router();

const {adminTicketStats,agentTicketStats}=require("../controllers/stats.controllers")

const requiredLogin=require("../middlewares/login")

const requiredRole=require("../middlewares/requiresRole")

router.get("/stats",requiredLogin,requiredRole("admin"),adminTicketStats)

router.get("/agentStats",requiredLogin,requiredRole("agent"),agentTicketStats)

module.exports=router