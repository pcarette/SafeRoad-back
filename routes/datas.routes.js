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
const { default: mongoose } = require("mongoose");

//GET methode for questions
router.get(
  "/questions",
  isAuthenticated,
  isolateUserId,
  async (req, res, next) => {
    // If JWT token is valid
    const nQuestions = 3;
    const user = await User.findById(req.userId);

    // Verify si une serie est deja en cours
    if (user.series.length > 0) {
      const lastSerie = await (
        await Serie.findById(user.series[user.series.length - 1])
      ).populate("questions");
      if (lastSerie.currentQuestion < lastSerie.questions.length) {
        // LE MIEUX SERAIT D'AJOUTER UN CHAMPS "STATUS (en cours ou finish)" DANS LA COLLECTION SERIE
        const { questions, currentQuestion } = lastSerie;
        const datasToSend = { questions, currentQuestion };
        return res.status(200).json(datasToSend);
      }
    }

    const randomDocs = await Question.aggregate([
      { $sample: { size: nQuestions } },
    ]);

    const questionIds = randomDocs.map(({ _id }) => _id);

    //then we create a new questions serie
    const newSerie = await (
      await Serie.create({ questions: questionIds, user: req.userId })
    ).populate("questions");

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
    return res.status(200).json(datasToSend);
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
    const user = await await User.findById(req.userId).populate("series");
    var actualSerie = user.series[user.series.length - 1];

    if (actualSerie.currentQuestion >= actualSerie.questions.length) {
      // LE MIEUX SERAIT D'AJOUTER UN CHAMPS "STATUS (en cours ou finish)" DANS LA COLLECTION SERIE
      return res.status(401).json({ message: "Cette série est deja terminée" });
    }

    const actualQuestion = await Question.findById(
      actualSerie.questions[actualSerie.currentQuestion]
    );

    if (
      !Array.isArray(selectedAnswers) ||
      !selectedAnswers.every((item) => typeof item === "number") ||
      selectedAnswers.length > actualQuestion.propositions.length
    ) {
      return res.status(401).json({ message: "Bad format for POST serie" });
    }
    if (indexQuestion !== actualSerie.currentQuestion) {
      return res
        .status(401)
        .json({ message: "Not the good indexQuestion for POST serie" });
    }

    actualSerie = await Serie.findByIdAndUpdate(
      actualSerie._id,
      {
        $set: {
          currentQuestion: actualSerie.currentQuestion + 1,
          [`inputsByUser.${actualSerie.currentQuestion}`]: selectedAnswers,
        },
      },
      { new: true }
    );

    // IF SERIE ISNT FINISH
    if (actualSerie.currentQuestion < actualSerie.questions.length) {
      return res
        .status(200)
        .json({ success: "ok", nextQuestion: actualSerie.currentQuestion });
    }

    // IF SERIE IS FINISH
    var datasToSend = {
      success: "ok",
      realAnswers: [],
      answersByUser: [...actualSerie.inputsByUser],
      score: 0,
    };
    var score = 0;
    for (const [index, idQuest] of actualSerie.questions.entries()) {
      const question = await Question.findById(idQuest);
      const answer = await Answer.findOne({ numero: question.numero });
      datasToSend.realAnswers.push(answer);
      const isCorrect = answerHelper.compareAnswers(
        actualSerie.inputsByUser[index],
        answer.answers
      );
      if (isCorrect) {
        score += 1;
      }
    }
    await Serie.findByIdAndUpdate(actualSerie._id, { $set: { score: score } });
    datasToSend.score = score;
    return res.status(200).json(datasToSend);
  }
);

router.get(
  "/series/",
  isAuthenticated,
  isolateUserId,
  async (req, res, next) => {
    const series = await Serie.find({ user: req.userId }).sort({
      createdAt: -1,
    });
    return res.status(200).json(series);
  }
);

router.get(
  "/serie/:serieId",
  isAuthenticated,
  isolateUserId,
  async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.serieId)) {
      return res.status(400).json({ message: "Not a valid ObjectId" });
    }
    const serie = await Serie.findOne({
      _id: req.params.serieId,
      user: req.userId,
    })
      .populate("questions")
      .lean();
    if (!serie) {
      return res.status(404).json({ message: "Serie not found" });
    }
    const answers = await Promise.all(
      serie.questions.map(({ numero }) =>
        Answer.findOne({ numero: numero }).lean()
      )
    );

    return res.status(200).json({ ...serie, answers });
  }
);

module.exports = router;
