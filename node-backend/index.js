// index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import helmet from "helmet";


// Routes
import authRoutes from "./routes/auth.routes.js";
import registryRoutes from "./routes/registry.routes.js";
import jobRoutes from './routes/job.routes.js'



dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(helmet());


// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "CareerLink backend running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/registry", registryRoutes);
app.use("/api/jobs", jobRoutes);

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();