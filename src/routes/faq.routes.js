
const express = require("express");

const router = express.Router();

const requireLogin = require("../middlewares/login");
const requiredRole = require("../middlewares/requiresRole");

const {getFaqs,createFaq,updateFaq,deleteFaq}=require("../controllers/faq.controllers");

// View published FAQs (logged-in users)
router.get("/", requireLogin, getFaqs);

// Create FAQ (Admin only)
router.post("/", requireLogin, requiredRole("admin"), createFaq);

// Update FAQ (Admin only)
router.put("/:id", requireLogin, requiredRole("admin"), updateFaq);

// Delete FAQ (Admin only)
router.delete("/:id", requireLogin, requiredRole("admin"), deleteFaq);

module.exports = router;