import express  from "express";
import dotenv   from "dotenv";
import cors     from "cors";
import http     from "http";
import { Server } from "socket.io";
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
import feedbackRoutes       from "./routes/feedbackRoutes.js";
import tableRoutes          from "./routes/tableRoutes.js";
import billRoutes           from "./routes/billRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

import errorMiddleware      from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());

// ─── Socket.io Setup ────────────────────────────────────────────────
const server = http.createServer(app); // Express app ko http server mein wrap kiya

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

app.set("io", io); // controllers is se access karenge: req.app.get("io")

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("join", (role) => {
    socket.join(role); // "admin" | "chef" | "waiter"
    console.log(`Socket ${socket.id} joined room: ${role}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

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
app.use("/api/staff",           staffRoutes);
app.use("/api/inventory",       inventoryRoutes);
app.use("/api/waiter",          waiterRoutes);
app.use("/api/feedback",        feedbackRoutes);
app.use("/api/tables",          tableRoutes);
app.use("/api/bills",           billRoutes);
app.use("/api/payment", paymentRoutes);
app.use(errorMiddleware);

// ─── Start ────────────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();
  await createAdminIfNotExists();
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`)); // app.listen se server.listen
};

startServer();