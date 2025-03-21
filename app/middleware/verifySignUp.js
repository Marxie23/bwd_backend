const User = require("../model/userModel");

checkDuplicateUsernameOrEmail = async (req, res, next) => {
    try {
        // Check if email is null or undefined
        if (!req.body.username) {
            return res.status(500).send({ message: "Username cannot be null or empty!", status: false });
        }
        // Check if the email is already in use
        const user = await User.findOne({ where: { Username: req.body.username } });
        if (user) {
            return res.status(400).send({ 
                message: "Registration failed, username is already in use!", 
                status: false 
            });
        }

        // Proceed to the next middleware or controller
        next();
    } catch (error) {
        console.error("Error checking duplicate username:", error);
        return res.status(500).send({ 
            message: "An error occurred while processing the request", 
            error: error.message,
            status: false 
        });
    }
};

const verifySignUp = {
    checkDuplicateUsernameOrEmail
};

module.exports = verifySignUp;
