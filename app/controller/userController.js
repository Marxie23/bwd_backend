
const config = require("../config/config")
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
const path = require("path");
const fs = require('fs');

const JWT_SECRET = config.SECRET_KEY;

const { Op, Sequelize } = require("sequelize");
const Position = require('../model/positionModel')
const User = require('../model/userModel');
const Customer = require('../model/customerModel');
const Meter = require('../model/meterModel');


exports.addUser = async (username,password,lastName,firstName,middleName,email,accessType,customerID) => {
    try{
        console.log("Input password: " + password)
        const hashedPassword = bcrypt.hashSync(password,8)
        const newUser = await User.create({
            Username: username,
            Password: hashedPassword,
            Lastname: lastName,
            Firstname: firstName,
            Middlename: middleName,
            Email: email,
            AccessType: accessType,
            Picture_path:'https://images.app.goo.gl/gayua6nbVsJSynBH9',
            IsActive: false,
            CustomerId: customerID
        })
        if(newUser){
            return true
        }
    }catch(error){
        console.error(error)
        return false
    }
}

exports.registerUser = (req, res)=>{
    try{
        if(!req.body.username && !req.body.password){
            res.status(400).send({
                message:"Content can not be empty!"
            });
            return;
        }

        const {userLastname,userFirstname,userMiddlename,username,email,password,userType} = req.body
        const hashedPassword = bcrypt.hashSync(password, 8);

        const newUser ={
            Email : email,
            Lastname : userLastname,
            Firstname: userFirstname,
            Middlename: userMiddlename,
            Username: username,
            Password: hashedPassword,
            AccessType: userType
        }

        User.create(newUser)
        .then(data => {
           res.json({
            status: true,
            message:"Registered Successfully!"
           })
        })
        .catch(err => {
            res.status(500).json({
                message: err.message || "Some error occurred while adding to database!"
            });
        });

    }catch(err){
        res.status(500).json({
            message: err.message || "Some error occurred while adding to database!"
        });
    }
}

exports.register = (req, res)=>{
    try{
        if(!req.body.username && !req.body.password){
            res.status(400).send({
                message:"Content can not be empty!"
            });
            return;
        }
        const hashedPassword = bcrypt.hashSync(req.body.password, 8);
        const newUser ={
            Email : req.body.email,
            Username: req.body.username,
            Password: hashedPassword,
            AccessType: req.body.accessType
        }

        User.create(newUser)
        .then(data => {
           res.json({
            status: true,
            message:"Registered Successfully!"
           })
        })
        .catch(err => {
            res.status(500).json({
                message: err.message || "Some error occurred while adding to database!"
            });
        });

    }catch(err){
        res.status(500).json({
            message: err.message || "Some error occurred while adding to database!"
        });
    }
}

exports.signIn = async (req, res)=>{

    try{
        const user = await User.findOne({ where: {Username: req.body.username } });
        if (!user) {
            res.status(404).send({
                accessToken: null,
                message:"User not found!",
                status: false,
            });
            return;
        }
        const passwordIsValid = bcrypt.compareSync(req.body.password, user.Password);
        if (!passwordIsValid) {
            res.status(401).send({
                accessToken: null,
                message:"Incorrect password!",
                status: false,
            });
            return;
        }

        if(user && passwordIsValid){

            const userID = user.UserID;

            const [updatedRows] = await User.update(
                { IsActive: true },
                { where: { UserID: userID } }
              );
          

            const token = jwt.sign({ username: user.Username  }, JWT_SECRET, { expiresIn: '3h' });

            // Set token in a secure, HTTP-only cookie
            res.cookie('authToken', token, {
                httpOnly: true,        // Prevent access from JavaScript
                secure: process.env.NODE_ENV === 'production', // Only send over HTTPS
                sameSite: 'Strict',    // Prevent cross-site sending
                // maxAge: 60 * 60 * 1000 // Token expiration (1 hour)
                maxAge: 24 * 60 * 60 * 1000 // Token expiration (24 hours)

            });

            res.status(200).json({
                user:{
                    id: user.UserID,
                    email: user.Email,
                    username: user.Username,
                    position: user.PositionId,
                    accessType: user.AccessType,
                    pictureURL: user.Picture_path,
                    customerID: user.CustomerId
                },
                message:"Login Successfully",
                status: true,
            });
            return;
        }

    }catch(err){
        res.status(500).json({
            message: "Some error occurred!",
            status: true,
        })
    }
    
}

exports.getUser = async (req, res) =>{

    try {
        const { currentUserID } = req.params;
    
        if (!currentUserID) {
          return res.status(400).json({
            status: false,
            message: "currentUserId is required"
        });
        }
    
        const users = await User.findAll({
        //   where: {
        //     UserID: {
        //       [Sequelize.Op.ne]: currentUserID,
        //     },
        //   },
          attributes: { exclude: ["Password"] },
        });

        const formattedUsers = users.map(users=>{
            return {
                id : users.UserID,
                fullName: `${users.Firstname} ${users.Middlename}. ${users.Lastname}`,
                username : users.Username,
                email : users.Email,
                userType : users.AccessType,
                status : users.IsActive,
                profilePicture : users.Picture_path
            }
        })
        return res.status(200).json({
            status: true,
            message:"Success",
            users: formattedUsers
        });
      } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
}
exports.logout = async (req, res) => {
    try {
      const { userId } = req.body;
  
      if (userId == null) {
        return res.status(400).json({ error: "userId and isActive are required" });
      }
  
      const [updatedRows] = await User.update(
        { IsActive: false },
        { where: { UserID: userId } }
      );
  
      if (updatedRows === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Ensure this is only cleared over HTTPS
        sameSite: 'Strict',
            }
        );
        res.status(200).json({ message: 'Logged out successfully' });

    } catch (error) {
      console.error("Error updating IsActive:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };

  exports.updateProfile = async (req, res) => {

    try {

        const { id } = req.params;

        const profilePicture = req.file ? `assets/${req.file.filename}` : null;

        const customer = await User.findByPk(id);
        if (!customer) return res.status(404).send({ message: "Customer not found" });

        if (profilePicture && customer.Picture_path) {
            const oldProfilePath = path.join(__dirname, "public/assets", customer.Picture_path);
            if (fs.existsSync(oldProfilePath)) {
                fs.unlinkSync(oldProfilePath);
            }
        }
        const newCustomer = await customer.update({
            Picture_path: profilePicture
        });

        res.status(200).send({
            message: "Customer updated successfully",
            status: true,
            pictureURL: newCustomer.Picture_path });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error updating customer", error: error.message });
    }
}

exports.getUserInfo = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                status: false,
                message: "id is required",
            });
        }

        const user = await User.findByPk(id, {
            include: [
                {
                    model: Customer,
                    as: "Customer",
                    include:[
                        {
                            model: Meter,
                            as:"Meters"
                        }
                    ]
                },
            ],
        });

        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found",
            });
        }
        let customerDetails = null;
        if (user.CustomerId) {
            customerDetails = {
                customer_id: user.Customer.CustomerID,
                customer_fullName: `${user.Customer.Firstname} ${user.Customer.Middlename || ""} ${user.Customer.Lastname}`,
                customer_accountNumber: user.Customer.AccountNum,
                customer_contactNumber: user.Customer.ContactNum,
                customer_email: user.Customer.Email,
                customer_address: user.Customer.Address,
                customer_meterNo: user.Customer.Meters[0].MeterNumber
            };
        }

        const formattedUser = {
            user_id: user.UserID,
            user_fullName: `${user.Firstname} ${user.Middlename || ""} ${user.Lastname}`,
            user_username: user.Username,
            user_email: user.Email,
            user_userType: user.AccessType,
            user_status: user.IsActive,
            user_profilePicture: user.Picture_path,
            customerDetails,
        };

        return res.status(200).json({
            status: true,
            message: "Success",
            user: formattedUser,
        });
    } catch (error) {
        console.error("Error fetching user information:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};

exports.updatePassword = async (req, res)=>{
    try{

        const {userId} = req.body
        if(!req.body.newPassword && !req.body.password){
            return res.status(400).send({
                status:false,
                message:"Password can not be empty!"
            });
        }
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).send({
                message:"User not found!",
                status: false,
            });
        }
        const passwordIsValid = bcrypt.compareSync(req.body.password, user.Password);
        if (!passwordIsValid) {
            return res.status(400).send({
                message:"Incorrect password!",
                status: false,
            });
        }
        if(passwordIsValid && user){
            const hashedPassword = bcrypt.hashSync(req.body.newPassword, 8);
            const newUser ={
                Username: req.body.username,
                Password: hashedPassword
            }
            const updatedUser = await user.update(newUser)
    
            return res.status(200).json({
                status: true,
                message:"Password changes Successfully!",
                user: updatedUser
            })
        }

    }catch(err){
        return res.status(500).json({
            message: err.message || "Some error occurred while adding to database!"
        });
    }
}