const express=require("express")

const router=express.Router();

const requireLogin=require("../middlewares/login")

const requiredRole=require("../middlewares/requiresRole")

const{createTicket,assignTicket,getTicket,listTickets,updateTicket,deleteTicket}=require("../controllers/ticket.controllers")

router.post("/createTickets",requireLogin,createTicket);

router.patch("/:id/assign",requireLogin,requiredRole("admin"),assignTicket)

router.get("/",requireLogin,listTickets)

router.get("/:id",requireLogin,getTicket);

router.patch("/:id",requireLogin,updateTicket)

router.delete("/:id",requireLogin,requiredRole("admin"),deleteTicket)

module.exports=router