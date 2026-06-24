import express from "express";
import {
  createJob,
  updateJobStatus,
  getApprovedJobs,
  getAllJobs,
  getMyJobs,
  getJobById,
  updateJob,
  deleteJob,
} from "../controllers/job.controller.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();


// Create
router.post("/", authMiddleware(["recruiter", "cdc"]), createJob);


// Read
router.get("/", authMiddleware(["student"]), getApprovedJobs);

router.get("/my", authMiddleware(["recruiter"]), getMyJobs);

router.get("/all", authMiddleware(["cdc"]), getAllJobs);

router.get("/:id", authMiddleware(["student", "recruiter", "cdc"]), getJobById);


// Update
router.patch("/:id", authMiddleware(["recruiter", "cdc"]), updateJob);

router.patch("/:id/status", authMiddleware(["cdc"]), updateJobStatus);


// Delete
router.delete("/:id", authMiddleware(["recruiter", "cdc"]), deleteJob);

export default router;
