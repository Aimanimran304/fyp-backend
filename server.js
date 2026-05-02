import express  from "express";
import dotenv   from "dotenv";
import cors     from "cors";
import connectDB from "./config/db.js";

// ✅ createAdminIfNotExists ab adminController se aayega
import { createAdminIfNotExists } from "./controllers/adminController.js";

// Routes
import authRoutes           from "./routes/authRoutes.js";
import userRoutes           from "./routes/userRoutes.js";
import menuRoutes           from "./routes/menuRoutes.js";
import orderRoutes          from "./routes/orderRoutes.js";
import reservationRoutes    from "./routes/reservationRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import allergyRoutes        from "./routes/allergyRoutes.js";
import contactRoutes        from "./routes/contactRoutes.js";
import healthProfileRoutes  from "./routes/healthProfileRoutes.js";
import adminRoutes          from "./routes/adminRoutes.js";
import errorMiddleware      from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth",            authRoutes);        // Customer: register, login
app.use("/api/users",           userRoutes);
app.use("/api/health-profile",  healthProfileRoutes);
app.use("/api/menu",            menuRoutes);
app.use("/api/orders",          orderRoutes);
app.use("/api/reservations",    reservationRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/allergy",         allergyRoutes);
app.use("/api/contact",         contactRoutes);
app.use("/api/admin",           adminRoutes);       // Admin: login + management

app.use(errorMiddleware);

// ─── Start ───────────────────────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();
  await createAdminIfNotExists(); // ✅ server start hote hi admin check/create
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
};

startServer();