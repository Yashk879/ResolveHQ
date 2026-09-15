const express=require("express")

const router=express.Router();

const {createCustomers,listCustomers,getCustomerById,allCustomers}=require("../controllers/customer.controller")

const requiredLogin=require("../middlewares/login");
const { get } = require("mongoose");

router.post("/create",requiredLogin,createCustomers)

router.get("/",requiredLogin,listCustomers)

router.post("/:id",requiredLogin,getCustomerById)

router.get("/",requiredLogin,allCustomers)

module.exports=router