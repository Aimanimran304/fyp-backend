import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import allergyRoutes from "./routes/allergyRoutes.js";

// Middleware
import errorMiddleware from "./middleware/errorMiddleware.js";

// ----------------------------
dotenv.config();
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/allergy", allergyRoutes);

// Error middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
