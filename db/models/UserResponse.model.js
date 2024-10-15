const mongoose = require('mongoose');
const { Schema } = mongoose;

const userResponseSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',   // Reference to the User collection
    required: true
  },
  serieId: {
    type: Schema.Types.ObjectId,
    ref: 'Serie',  // Reference to the Serie collection
    required: true
  },
  questionId: {
    type: Schema.Types.ObjectId,
    ref: 'Question',  // Reference to the Question collection
    required: true
  },
  selectedAnswers: [{
    type: Schema.Types.Number,
    required: true
  }],
  isCorrect: {
    type: Boolean,  // Optional: Store if the answer(s) are correct
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now  // Automatically store when the response was submitted
  }
});

// Optional: Indexes for faster querying
userResponseSchema.index({ userId: 1, serieId: 1, questionId: 1 });

const UserResponse = mongoose.model('UserResponse', userResponseSchema);

module.exports = UserResponse;
