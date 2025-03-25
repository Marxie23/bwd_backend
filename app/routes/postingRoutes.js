const verifyToken = require("../middleware/authJWT");
const postController = require("../controller/postingController");

// Multer setup for file uploads
const multer = require("multer");
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
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Routes for managing posts
  app.post("/api/auth/posts", [[upload.single('postPicture'),verifyToken]], postController.createPost); // Create a new post
  app.get("/api/auth/posts", [verifyToken], postController.getAllPosts); // Get all posts
  app.get("/api/auth/posts/:id", [verifyToken], postController.getPostById); // Get post by ID
  app.put("/api/auth/posts/:id", [upload.single('postPicture'),verifyToken], postController.updatePost); // Update a post
  app.delete("/api/auth/posts/:id", [verifyToken], postController.deletePost); // Delete a post
  app.get("/api/auth/posts/get/:category", postController.getPostsByCategory);

  // Optional routes
  //app.get("/api/auth/posts/category/:category", [verifyToken], postController.getPostsByCategory); // Get posts by category
}
