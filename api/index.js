import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import authRoutes from "../routes/authRoutes.js";

dotenv.config();

const app = express();

// Connect DB
connectDB();

// ✅ CORS configuration (FIX)
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://online-course-ten-mauve.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  })
);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("🚀 API is running on Vercel...");
});

// ❌ DO NOT use app.listen()
export default app;
