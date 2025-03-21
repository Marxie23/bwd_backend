const { Op } = require("sequelize");
const Billing = require("../model/billingModel");
const Customer = require("../model/customerModel");
const nodemailer = require('nodemailer');

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

exports.sendDueDateReminders = async (req,res) => {
    try {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() + 1); // 1 day from now
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 3); // 3 days from now
      endDate.setHours(23, 59, 59, 999);
      
      const dueBillings = await Billing.findAll({
          where: {
              DueDate: {
                  [Op.between]: [startDate, endDate], // Match DueDate between 1 and 3 days from now
              },
              PaymentStatus: "Unpaid",
          },
          include: {
              model: Customer,
              as: "Customer",
              attributes: ["Email", "Firstname", "Lastname"],
          },
      });

        if (dueBillings.length === 0) {
            return res.status(404).json({message:"No customers with due bills in 2 days.", status: false});
        }

        // Send email notifications
        for (const billing of dueBillings) {
            const { Email, Firstname, Lastname } = billing.Customer;
            const { AmountDue, DueDate } = billing;

            const subject = "Payment Reminder: Your Bill is Due Soon";
            const text = `Dear ${Firstname} ${Lastname},\n\nYour payment of PHP ${AmountDue.toFixed(2)} is due on ${DueDate.toDateString()}.\n\nPlease settle it to avoid penalties.\n\nThank you!\n\n- Bongao Water District`;

            const emailSent = await sendEmail(Email, subject, text);
            if (emailSent) {
              res.status(201).json({
                message: "Billing reminder send successfully",
                status: true,
                data: emailSent,
            });
            } else {
              res.status(500).json({ message: "Server error",status: false });
            }
        }
    } catch (error) {
        console.error("Error sending due date reminders:", error);
        res.status(500).json({ message: "Server error", error: error.message });

    }
};
