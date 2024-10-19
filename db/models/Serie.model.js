const { Schema, model } = require("mongoose");

// series collection
const serieSchema = new Schema(
  {
    questions: {
      type: [Schema.Types.ObjectId],
      ref: "Question",
      required: [true, "question is required."],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    inputsByUser: { type: [[Number]] },
    currentQuestion: { type: Number, default: 0 },
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
);

const Serie = model("Serie", serieSchema);

module.exports = Serie;

