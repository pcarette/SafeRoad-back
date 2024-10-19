const { Schema, model } = require("mongoose");


// questions collection
const questionSchema = new Schema(
  {
    numero: {
      type: Number,
      required: [true, "Numero is required."],
      unique: true,
    },
    question: {
      type: String,
      required: [true, "question is required."],
    },
    propositions: {
      type: [String],
      required: [true, "propositions are required."],
    },
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
);

const Question = model("Question", questionSchema);








module.exports = Question;
