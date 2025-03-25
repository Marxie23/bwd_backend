const Post = require("../model/postingModel");
const multer = require("multer");
const path = require("path");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Create a post
exports.createPost = async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const imageUrl = req.file ? `/assets/${req.file.filename}` : null;
    console.log(imageUrl)
    console.log(title + "ddd")

    if (!title || !description || !category) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const post = await Post.create({
      Title: title,
      Description: description,
      Category: category,
      ImageURL: imageUrl,
    });

    res.status(201).json({ message: "Post created successfully.",status:true, post });
  } catch (error) {
    res.status(500).json({ message: "Error creating post.",status:false, error: error.message });
  }
};

// Get all posts
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.findAll({ order: [["createdAt", "DESC"]] });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving posts.", error: error.message });
  }
};

// Get a single post by ID
exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByPk(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving post.", error: error.message });
  }
};

// Update a post
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category } = req.body;
    const imageUrl = req.file ? `/assets/${req.file.filename}` : null;

    const post = await Post.findByPk(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    await post.update({
      Title: title,
      Description: description,
      Category: category,
      ImageURL: imageUrl || post.imageUrl,
    });

    res.status(200).json({ message: "Post updated successfully.",status:true, post });
  } catch (error) {
    res.status(500).json({ message: "Error updating post.",status:false, error: error.message });
  }
};

// Delete a post
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByPk(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found.", status:false });
    }

    await post.destroy();
    res.status(200).json({ message: "Post deleted successfully.", status:true });
  } catch (error) {
    res.status(500).json({ message: "Error deleting post.",status:false, error: error.message });
  }
};

// Get posts by category
exports.getPostsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    if (!category) {
      return res.status(400).json({ message: "Category is required." });
    }

    const posts = await Post.findAll({
      where: { Category: category },
      order: [["DateCreated", "DESC"]],
    });

    if (posts.length === 0) {
      return res.status(404).json({ message: "No posts found in this category.",status:false });
    }

    res.status(200).json({message:"Post",status:true,posts});
  } catch (error) {
    res.status(500).json({ message: "Error retrieving posts by category.", error: error.message });
  }
};
