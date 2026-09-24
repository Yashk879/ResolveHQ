const express=require("express")

const router=express.Router();

const {createCustomers,listCustomers,getCustomerById,getCustomerTickets}=require("../controllers/customer.controller")

const requiredLogin=require("../middlewares/login");

router.post("/create",requiredLogin,createCustomers)

router.get("/",requiredLogin,listCustomers)

router.get("/:id",requiredLogin,getCustomerById)

router.get("/:id/tickets",requiredLogin,getCustomerTickets)

module.exports=router