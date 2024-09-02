const express = require("express");
const router = express.Router();

const  Question = require("../db/models/Question.model");
const  Answer = require("../db/models/Answer.model");

const { isAuthenticated } = require("../middleware/jwt.middleware.js");





//GET methode for questions
router.get("/questions", isAuthenticated, async (req, res, next) => {
  // If JWT token is valid
  
  const nQuestions = 3;
  
  const randomDocs = await Question.aggregate([
      { $sample: { size: nQuestions } }
    ]);
  
  // Send back the token payload object containing the user data
  res.status(200).json(randomDocs);
});




//POST method for answers
router.post("/answers", isAuthenticated, async (req, res, next) => {
  // If JWT token is valid
  
  const maxNList = 3;
  const { list } = req.body;
  
  	
  if(!Array.isArray(list) || list.length > maxNList || list.length <= 0) {
  	res.status(200).json("Vous pouvez demander entre 0 et 3 réponses."); }
  else {
	  const specificDocs = await Answer.find({
	      numero: { $in: list }
	    });

	  // Send back the token payload object containing the user data
	  res.status(200).json(specificDocs); }
  
});








module.exports = router;
