import mongoose from "mongoose";
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    terms: String,
    user: {
      type: mongoose.Types.ObjectId,
      ref: "user",
    },
    summary: String,
    summary_prompt: String,
    problem: String,
    problem_prompt: String,
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "modified_at" } }
);

//Model
const model = mongoose.model("terms", schema);

export default model;
