const express=require("express")

const router=express.Router();

const {listCompanies}=require("../controllers/company.controllers")

router.get("/",listCompanies)

module.exports=router