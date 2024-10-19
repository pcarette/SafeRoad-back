const express = require("express");
const router = express.Router();

const Question = require("../db/models/Question.model");
const Answer = require("../db/models/Answer.model");
const Serie = require("../db/models/Serie.model.js");
const User = require("../db/models/User.model.js");

const answerHelper = require("../helpers/answers.helper.js");

const {
  isAuthenticated,
  isolateUserId,
} = require("../middleware/jwt.middleware.js");





//GET methode for questions
router.get(
  "/questions",
  isAuthenticated,
  isolateUserId,
  async (req, res, next) => {
    // If JWT token is valid

    const nQuestions = 3;

    const randomDocs = await Question.aggregate([
      { $sample: { size: nQuestions } },
    ]);

    const questionIds = randomDocs.map(({ _id }) => _id);

    //then we create a new questions serie
    const newSerie = await (
      await Serie.create({ questions: questionIds, user: req.userId })
    ).populate("questions");

    const user = await User.findById(req.userId);

    if (user.series.length < 10) {
      await User.updateOne(
        { _id: req.userId },
        { $push: { series: newSerie._id } }
      );
    } else {
      const [oldestSerie, ...series] = user.series;
      await Serie.deleteOne({ _id: oldestSerie });
      await User.updateOne(
        { _id: req.userId },
        { series: [...series, newSerie._id] }
      );
    }

    // Send back the token payload object containing the user data
    const { questions, currentQuestion } = newSerie;
    const datasToSend = { questions, currentQuestion };
    res.status(200).json(datasToSend);
  }
);




//POST method for series
router.post(
  "/serie/last",
  isAuthenticated,
  isolateUserId,
  async (req, res, next) => {
  
    // If JWT token is valid
    const { selectedAnswers, indexQuestion } = req.body;
    const user = await ( await User.findById(req.userId).populate('series'));
    const actualSerie = user.series[user.series.length - 1];
    const actualQuestion = await Question.findById(actualSerie.questions[actualSerie.currentQuestion]);
    
    if( !Array.isArray(selectedAnswers) || selectedAnswers.every(item => typeof item === 'number') || selectedAnswers.length > actualQuestion.propositions.length) {
    	return res.status(401).json({message : "Bad format for POST serie"});
    }
    
    if(indexQuestion !== actualSerie.currentQuestion) {
    	return res.status(401).json({message : "Not the good indexQuestion for POST serie"});
    }
    
    actualSerie = await Serie.findByIdAndUpdate(
      actualSerie._id,
      { $set: { currentQuestion: actualSerie.currentQuestion + 1, [inputsByUser[actualSerie.currentQuestion]]: selectedAnswers } },
      { new: true }
    );
    
    
    // IF SERIE ISNT FINISH
    if(actualSerie.currentQuestion < actualSerie.questions.length) {
    	return res.status(200).json({success : "ok", nextQuestion : actualSerie.currentQuestion});
	}
	
	// IF SERIE IS FINISH
	var datasToSend = {success: "ok", realAnswers: actualSerie.inputsByUser, answersByUser: [], score: 0};
	var score = 0;
	for (const [index, idQuest] of actualSerie.questions.entries()) {
		const question = await Question.findById(idQuest);
		const answer = await Answer.findOne({numero : question.numero});
		datasToSend.realAnswers.push(answer);
		const isCorrect = answerHelper.compareAnswers( actualSerie.inputsByUser[index], answer.answers );  if (isCorrect) {score += 1;};
	}
	datasToSend.score = score;
	return res.status(200).json(datasToSend);
  }
);





module.exports = router;
