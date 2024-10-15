const { expressjwt: jwt } = require("express-jwt");
const { verify : verifyJwt } = require("jsonwebtoken");


// Instantiate the JWT token validation middleware
const isAuthenticated = jwt({
  secret: process.env.TOKEN_SECRET,
  algorithms: ["HS256"],
  requestProperty: "payload",
  getToken: getTokenFromHeaders,
});

const handleJwtErrors = (err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    // If there's a problem with the token
    return res.status(401).json({ message: "Invalid or missing token" });
  }
  next(err); // Pass the error to the default error handler if it's not an UnauthorizedError
};

// Function used to extract the JWT token from the request's 'Authorization' Headers
function getTokenFromHeaders(req) {
  // Check if the token is available on the request Headers
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    // Get the encoded token string and return it
    const token = req.headers.authorization.split(" ")[1];
    return token;
  }
  
  return null;
}

function isolateUserId (req, res, next) {
  const token = req.headers.authorization.split(" ")[1];
  verifyJwt(token, process.env.TOKEN_SECRET, async (err, decoded) => {
    if (err) {
      res.status(401).json({message : "Error while reading JWT"})
    }
    req.userId = decoded._id;
    next();
  })
}
// Export the middleware so that we can use it to create protected routes
module.exports = {
  isAuthenticated,
  isolateUserId,
  handleJwtErrors,
};
