import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  eligibility: {
    branch: [String],
    minCGPA: Number,
    skills: [String]
  },
  deadline: Date,
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: "Recruiter" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // CDC or recruiter
}, { timestamps: true });

export default mongoose.model("Job", jobSchema);
