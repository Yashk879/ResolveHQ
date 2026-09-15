const express=require("express")

const router=express.Router();

const {createAgent,allAgents,updateAgent}=require("../controllers/agent.controller")

const requiredLogin=require("../middlewares/login")

const requiredRole=require("../middlewares/requiresRole")

router.post("/createAgent",requiredLogin,requiredRole("admin"),createAgent)

router.get("/allAgents",requiredLogin,requiredRole("admin"),allAgents)

router.patch("/:id",requiredLogin,requiredRole("admin"),updateAgent)

module.exports=router;