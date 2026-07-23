import express  from "express";
import dotenv   from "dotenv";
import cors     from "cors";
import connectDB from "./config/db.js";

import { createAdminIfNotExists } from "./controllers/adminController.js";

// ── Existing Routes ───────────────────────────────────────────────
import authRoutes           from "./routes/authRoutes.js";
import userRoutes           from "./routes/userRoutes.js";
import menuRoutes           from "./routes/menuRoutes.js";
import orderRoutes          from "./routes/orderRoutes.js";       // ✅ updated
import reservationRoutes    from "./routes/reservationRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import allergyRoutes        from "./routes/allergyRoutes.js";
import contactRoutes        from "./routes/contactRoutes.js";
import healthProfileRoutes  from "./routes/healthProfileRoutes.js";
import adminRoutes          from "./routes/adminRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";

// ── New Routes ────────────────────────────────────────────────────
import staffRoutes          from "./routes/staffRoutes.js";
import inventoryRoutes      from "./routes/inventoryRoutes.js";
import waiterRoutes         from "./routes/waiterRoutes.js";
import feedbackRoutes       from "./routes/feedbackRoutes.js";    // ✅ new

import errorMiddleware      from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────
app.use("/api/auth",            authRoutes);
app.use("/api/users",           userRoutes);
app.use("/api/health-profile",  healthProfileRoutes);
app.use("/api/menu",            menuRoutes);
app.use("/api/orders",          orderRoutes);         // /kitchen, /live, /:id/status
app.use("/api/reservations",    reservationRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/allergy",         allergyRoutes);
app.use("/api/contact",         contactRoutes);
app.use("/api/cart",            cartRoutes);
app.use("/api/admin",           adminRoutes);

// ── New ───────────────────────────────────────────────────────────
app.use("/api/staff",           staffRoutes);         // Admin: staff manage
app.use("/api/inventory",       inventoryRoutes);     // Admin + Chef: inventory
app.use("/api/waiter",          waiterRoutes);        // Waiter alerts
app.use("/api/feedback",        feedbackRoutes);      // Customer feedback + Admin review

app.use(errorMiddleware);

// ─── Start ────────────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();
  await createAdminIfNotExists();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
};

startServer();