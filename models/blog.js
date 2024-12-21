const { Schema, model } = require("mongoose");

const blogSchema = new Schema({
  title: { type: String, required: true, unique: true },
  description: { type: String },
  body: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  state: { type: String, enum: ["draft", "published"], default: "draft" },
  read_count: { type: Number, default: 0 },
  reading_time: { type: Number },
  tags: [String],
  timestamp: { type: Date, default: Date.now },
});
module.exports = model("Blog", blogSchema);
