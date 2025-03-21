const nodemailer = require('nodemailer');
require('dotenv').config();

const Customer = require("../model/customerModel")
const Meter  = require("../model/meterModel");

const userController = require("../controller/userController")
// Create a new customer

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'bongaowaterdistrictmarxie@gmail.com',
      pass: 'uhfy ajkh nvjs bczy',
    },
  });
  
  // Utility function to send email
  const sendEmail = async (to, subject, text) => {
    const mailOptions = {
      from: 'bongaowaterdistrictmarxie@gmail.com',
      to,
      subject,
      text,
    };
  
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.response);
      return true

    } catch (error) {
      console.error('Error sending email:', error.message);
      return false
    }
  };

const checkMeterExists = async (MeterModel, meterNumber) => {
    try {
      // Use findOne to check for an existing meter based on MeterNumber
      const meter = await MeterModel.findOne({ where: { MeterNumber: meterNumber } });
      
      // Return true if meter exists, false otherwise
      return Boolean(meter);
    } catch (error) {
      // Log the error with more specific information
      console.error(`Error checking if Meter with MeterNumber ${meterNumber} exists:`, error);
      // Rethrow the error to let the caller handle it
      throw error;
    }
  };

  const generateRandomString = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };
  

exports.create = async (req, res) => {
    try {
        const { accountNum, firstName, middleName, lastName, contactNum, meterNumber, address, installationDate,email } = req.body;

        const exists = await checkMeterExists(Meter, meterNumber);
        console.error(exists)
        if(exists){
            return res.status(400).json({
                message: "Meter already exists",
                status: false
            });
        }
        const customer = await Customer.create({
            AccountNum: accountNum,
            Firstname: firstName,
            Middlename: middleName,
            Lastname: lastName,
            ContactNum: contactNum,
            Address: address,
            Email: email,
            Status: true,
            IsDeleted: false
        });
        const meter = await Meter.create({
            MeterNumber: meterNumber,
            CustomerId: customer.CustomerID,
            InstallationDate: installationDate,
            Status: true,
        });

        const customerID = customer.CustomerID;
        const username = `CUSTOMER${accountNum}`;
        const password = generateRandomString()
        const lName = lastName;
        const fName = firstName;
        const mName = middleName;
        const mail = email;
        const accessType = "CUSTOMER";

        const user = await userController.addUser(username,password,lName,fName,mName,mail,accessType,customerID)

        if (customer && user && meter){
            await sendEmail(
            email,
            'Account Credentails in Bongao Water Distict Billing Website',
            `Dear Mr/Mrs.${fName} ${lastName},\n\nYour account credentials has been created.\nUse this to login in the website.\nAccount Number: ${accountNum}\n\Username: ${username}\nPassword: ${password}\n\nThank you.\nBongao Water District Website Billing`
        );

        }
        return res.status(201).send({
            message: "Customer created successfully",
            status: true
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: "Error creating customer",
            status: false,
            error: error.message,
        });
    }
};

// Get all customers
exports.getAll = async (req, res) => {
    try {
        const customers = await Customer.findAll({
            where:{
                IsDeleted: false
            },
            include:[
                {model: Meter, as: 'Meters'}
            ],
            order: [['Lastname', 'ASC']]
        });
        res.status(200).send({
            status: true,
            customers
        });
    } catch (error) {
        console.error(error)
        res.status(500).send({
            status: false,
            error: error.message,
        });
    }
};

// Get a customer by ID
exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await Customer.findByPk(id);

        if (!customer) {
            return res.status(404).send({ message: "Customer not found", status:false });
        }

        const meter = await Meter.findOne({
            where:{
                CustomerId: id
            }
        })

        res.status(200).send({
            message:"Customer found",
            status: true,
            customer:{customer, meter}
        });
    } catch (error) {
        res.status(500).send({
            message: "Error retrieving customer",
            error: error.message,
        });
    }
};

// Update a customer
exports.update = async (req, res) => {
    try {
        const { id } = req.params;

        const { accountNum, firstName, middleName, lastName, contactNum, meterNumber, address, installationDate,email } = req.body;

        const customer = await Customer.findByPk(id);
        if (!customer) {
            return res.status(404).send({ message: "Customer not found", status: false});
        }

        const meter = await Meter.findOne({
            where:{
                CustomerId: id
            }
        })

        await customer.update({
            AccountNum: accountNum,
            Firstname: firstName,
            Middlename: middleName,
            Lastname: lastName,
            ContactNum: contactNum,
            Address: address,
            Email: email,
            Status: true,
            IsDeleted: false
        });
        await meter.update({
            MeterNumber: meterNumber,
            CustomerId: customer.CustomerID,
            InstallationDate: installationDate,
            Status: true
        });

        res.status(200).send({
            message: "Customer updated successfully",
            data: customer,
            status: true
        });
    } catch (error) {
        res.status(500).send({
            message: "Error updating customer",
            error: error.message,
            status:false
        });
    }
};

// Delete a customer
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await Customer.findByPk(id);
        if (!customer) {
            return res.status(404).send({ message: "Customer not found", status:false});
        }

        await customer.update({
            IsDeleted: true
        });
        res.status(200).send({ message: "Customer deleted successfully", status: true });
    } catch (error) {
        res.status(500).send({
            message: "Error deleting customer",
            error: error.message,
            status: false
        });
    }
};
