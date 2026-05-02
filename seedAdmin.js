// seedAdmin.js — ek baar run karo
import mongoose from "mongoose";
import bcrypt   from "bcryptjs";
import dotenv   from "dotenv";
import User     from "./models/User.js";

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);

const existing = await User.findOne({ email: "admin@restrotech.com" });
if (existing) {
  console.log("Admin already exists!");
  process.exit();
}

// seedAdmin.js fix:
const hashed = await bcrypt.hash("Admi$123", 10);  // ← match karo
await User.create({
  name:     "Admin",
  email:    "adminrestrotech@gmail.com",
  password: hashed,
  role:     "admin",
  phone:    "03000000000",
  address:  "RestroTech HQ",
});

console.log("✅ Admin created! Email: adminrestrotech@gmail.com | Pass: Admi$123");
await mongoose.disconnect();
process.exit();