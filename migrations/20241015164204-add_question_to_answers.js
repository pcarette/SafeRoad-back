module.exports = {
  async up(db, client) {
    const questionsCollection = db.collection('questions');
    const answersCollection = db.collection('answers');

    const answers = await answersCollection.find().toArray();

    for (let answer of answers) {
      // Find the corresponding question by numero
      const question = await questionsCollection.findOne({ numero: answer.numero });

      if (question) {
        // Update the answer document to add the question's _id
        await answersCollection.updateOne(
          { _id: answer._id },
          { $set: { question: question._id } }
        );
      }
    }
  },

  async down(db, client) {
    // In the down function, we'll remove the `question` field
    const answersCollection = db.collection('answers');

    await answersCollection.updateMany(
      {},
      { $unset: { question: "" } }
    );
  }
};
