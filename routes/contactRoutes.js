import express from "express";
import {
  submitContactForm,
  getContacts,
} from "../controllers/contactController.js";

const router = express.Router();

// ✅ Public route - Contact form submit
router.post("/", submitContactForm);

// ✅ Admin route - Get all messages
router.get("/", getContacts);

export default router;