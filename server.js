import express from "express";
import cors from "cors";

import loadEnv from "./config/env.js";
import connectDB from "./config/db.js";
import errorMiddleware from "./middleware/errorMiddleware.js";

loadEnv();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("FYP Backend is running");
});

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
