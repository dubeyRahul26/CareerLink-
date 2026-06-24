import mongoose from "mongoose";
import Job from "../models/job.js";

// Create Job
export const createJob = async (req, res) => {
  try {
    const { title, description, eligibility, deadline, recruiterId } = req.body;

    // Basic validation
    if (!title || !description || !eligibility || !deadline) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    let jobRecruiterId;
    let status = "pending";

    if (req.user.role === "recruiter") {
      jobRecruiterId = req.user.id;
    } else if (req.user.role === "cdc") {
      status = "approved";

      if (!recruiterId) {
        return res.status(400).json({
          success: false,
          message: "recruiterId is required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(recruiterId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid recruiterId",
        });
      }

      jobRecruiterId = recruiterId;
    } else {
      return res.status(403).json({
        success: false,
        message: "Unauthorized role",
      });
    }

    const job = await Job.create({
      title: title.trim(),
      description: description.trim(),
      eligibility,
      deadline,
      status,
      recruiterId: jobRecruiterId,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: job,
    });
  } catch (error) {
    console.error("createJob:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create job",
    });
  }
};

// Approve/Reject Job
export const updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID",
      });
    }

    const allowedStatuses = ["approved", "rejected"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be approved or rejected",
      });
    }

    const job = await Job.findByIdAndUpdate(
      id,
      { status },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job status updated",
      data: job,
    });
  } catch (error) {
    console.error("updateJobStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update job status",
    });
  }
};

// Get Approved Jobs (for students)
export const getApprovedJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: "approved" })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    console.error("getApprovedJobs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
    });
  }
};

// Get all jobs posted by a particular recruiter
export const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({
      recruiterId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    console.error("getMyJobs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recruiter jobs",
    });
  }
};

// Get All Jobs (CDC Dashboard)
export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    console.error("getAllJobs:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
    });
  }
};

// Get Job by Id
export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID",
      });
    }

    const job = await Job.findById(id).lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Students should only access approved jobs
    if (req.user.role === "student" && job.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Recruiters can only access their own jobs
    if (
      req.user.role === "recruiter" &&
      job.recruiterId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }
    return res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error("getJobById:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch job",
    });
  }
};

// Update a particular Job
export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID",
      });
    }

    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const isOwner = job.recruiterId.toString() === req.user.id;

    if (req.user.role !== "cdc" && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Prevent updates to protected fields
    const forbiddenFields = [
      "status",
      "recruiterId",
      "createdBy",
      "_id",
    ];

    const attemptedForbiddenField = forbiddenFields.find(
      (field) => field in req.body
    );

    if (attemptedForbiddenField) {
      return res.status(400).json({
        success: false,
        message: `${attemptedForbiddenField} cannot be updated from this endpoint`,
      });
    }

    let hasBusinessChanges = false;

    if (
      req.body.title !== undefined &&
      req.body.title !== job.title
    ) {
      job.title = req.body.title.trim();
      hasBusinessChanges = true;
    }

    if (
      req.body.description !== undefined &&
      req.body.description !== job.description
    ) {
      job.description = req.body.description.trim();
      hasBusinessChanges = true;
    }

    if (req.body.deadline !== undefined) {
      job.deadline = req.body.deadline;
      hasBusinessChanges = true;
    }

    // Deep merge eligibility object
    if (
      req.body.eligibility &&
      typeof req.body.eligibility === "object"
    ) {
      job.eligibility = {
        ...(job.eligibility?.toObject?.() ?? job.eligibility ?? {}),
        ...req.body.eligibility,
      };

      hasBusinessChanges = true;
    }

    // Recruiter edits approved job => re-approval required
    if (
      hasBusinessChanges &&
      req.user.role === "recruiter" &&
      job.status === "approved"
    ) {
      job.status = "pending";
    }

    await job.save();

    return res.status(200).json({
      success: true,
      message: "Job updated successfully",
      data: job,
    });
  } catch (error) {
    console.error("updateJob:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update job",
    });
  }
};

// Delete a particular Job
export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID",
      });
    }

    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const isOwner = job.recruiterId.toString() === req.user.id;

    if (req.user.role !== "cdc" && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await job.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("deleteJob:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete job",
    });
  }
};
