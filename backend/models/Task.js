import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
      index: true,
    },
    externalSource: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    externalId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    due_date: { type: Date, required: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    completed: { type: Boolean, default: false },
    priority: { type: String, enum: ["high", "medium", "low"], default: "low" },
  },
  { timestamps: true }
);

taskSchema.index({ userEmail: 1, externalSource: 1, externalId: 1 }, { unique: true, sparse: true });

const Task = mongoose.model("Task", taskSchema);

export default Task;
