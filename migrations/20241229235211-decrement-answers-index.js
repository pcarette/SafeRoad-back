module.exports = {
  async up(db, client) {
    // TODO write your migration here.
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});
    const collection = db.collection("answers"); // Replace with your collection name
    
    // Find all documents with an 'answers' array
    const cursor = collection.find({ answers: { $exists: true } });

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const updatedAnswers = doc.answers.map((value) => value - 1);

      // Update the document with the modified array
      await collection.updateOne(
        { _id: doc._id },
        { $set: { answers: updatedAnswers } }
      );
    }
  },
  
  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
    // Find all documents with an 'answers' array
    const collection = db.collection("answers"); // Replace with your collection name
    const cursor = collection.find({ answers: { $exists: true } });
    
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const updatedAnswers = doc.answers.map((value) => value + 1);
    
      // Update the document with the modified array
      await collection.updateOne(
        { _id: doc._id },
        { $set: { answers: updatedAnswers } }
      );
    }
  },
};
