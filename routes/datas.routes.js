const express = require("express");
const router = express.Router();

const Question = require("../db/models/Question.model");
const Answer = require("../db/models/Answer.model");
const Serie = require("../db/models/Serie.model.js");

const answerHelper = require("../helpers/answers.helper.js");

const {
  isAuthenticated,
  isolateUserId,
} = require("../middleware/jwt.middleware.js");
const UserResponse = require("../db/models/UserResponse.model.js");

//GET methode for questions
router.get(
  "/questions",
  isAuthenticated,
  isolateUserId,
  async (req, res, next) => {
    // If JWT token is valid

    const nQuestions = 3;

    const now = new Date();
    const twentySecondsAgo = new Date(now.getTime() - 20 * 1000 * nQuestions);

    const lastValidSerie = await Serie.findOne({
      createdAt: { $gte: twentySecondsAgo },
    }).populate("questions");

    console.log("lastValidSerie : ", lastValidSerie);

    if (lastValidSerie) {
      res.status(200).json(lastValidSerie);
      return;
    }

    //If there's no recent serie, create a new one and return it

    const randomDocs = await Question.aggregate([
      { $sample: { size: nQuestions } },
    ]);

    const questionIds = randomDocs.map(({ _id }) => _id);

    //then we create a new questions serie
    const newSerie = await (
      await Serie.create({ questions: questionIds, user: req.userId })
    ).populate("questions");

    // Send back the token payload object containing the user data
    res.status(200).json(newSerie);
  }
);

//POST method for answers
router.get(
  "/serie/:serieId",
  isAuthenticated,
  isolateUserId,
  async (req, res, next) => {
    // If JWT token is valid
    console.log("req.params.serieId : ", req.params.serieId);
    console.log("req.body : ", req.body);

    const score = await UserResponse.countDocuments({
      userId: req.userId,
      serieId: req.params.serieId,
      isCorrect: true,
    });

    const serie = await Serie.findOneAndUpdate({ user: req.userId });

    const maxNList = 3;
    const { selectedAnswers, questionId } = req.body;

    const answer = await Answer.findOne({ question: questionId });

    const answersFormatted = answerHelper.transformPropositions(answer.answers);

    const isCorrect = answerHelper.compareAnswers(
      selectedAnswers,
      answersFormatted
    );

    const userResponse = await UserResponse.create({
      userId: req.userId,
      serieId: req.params.serieId,
      questionId,
      selectedAnswers,
      isCorrect,
    });

    res.status(200).json(userResponse);
  }
);

//POST method for answers
router.post(
  "/serie/:serieId",
  isAuthenticated,
  isolateUserId,
  async (req, res, next) => {
    // If JWT token is valid
    console.log("req.params.serieId : ", req.params.serieId);
    console.log("req.body : ", req.body);

    const { selectedAnswers, questionId } = req.body;

    console.log("questionId : ", questionId);

    const answer = await Answer.findOne({ question: questionId }).lean();

    console.log("answer : ", answer);

    if (!answer) {
      return;
    }

    const answersFormatted = answerHelper.transformPropositions(answer.answers);

    console.log("answersFormatted : ", answersFormatted);

    const isCorrect = answerHelper.compareAnswers(
      selectedAnswers,
      answersFormatted
    );

    console.log("isCorrect : ", isCorrect);

    const userResponse = await UserResponse.create({
      userId: req.userId,
      serieId: req.params.serieId,
      questionId,
      selectedAnswers,
      isCorrect,
    });

    res.status(200).json(userResponse);
  }
);

module.exports = router;
