// Multer setup for file uploads
const multer = require("multer");
const path = require("path");
const verifySignUp = require("../middleware/verifySignUp");
const verifyToken = require("../middleware/authJWT");
const userController = require("../controller/userController");

// Configure storage for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log("Setting destination...");
        cb(null, "public/assets");
    },
    filename: (req, file, cb) => {
        console.log("Processing filename...");
        cb(null, `${file.originalname}`);
    },
});

// Create the multer instance
const upload = multer({storage});


module.exports = function (app) {
    app.use(function (req, res, next){
        res.header("Access-Control-Allow-Origin");
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next()
    });
    app.post('/api/auth/signup',[verifySignUp.checkDuplicateUsernameOrEmail], userController.register);
    app.post('/api/auth/signin', userController.signIn);
    app.get('/api/auth/users/:currentUserID',[verifyToken], userController.getUser)
    app.post('/api/auth/logout', userController.logout);
    app.post('/api/auth/users/add',[verifySignUp.checkDuplicateUsernameOrEmail, verifyToken], userController.registerUser)
    app.post("/api/auth/user/profile/:id",[upload.single('profilePicture'),verifyToken], userController.updateProfile);
    app.get("/api/auth/user/profile/:id",[verifyToken], userController.getUserInfo);
    app.post("/api/auth/user/profile",[verifyToken],userController.updatePassword);
}