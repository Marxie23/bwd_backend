const nodemailer = require('nodemailer');
require('dotenv').config();

const Transaction = require("../model/transactionModel");
const Customer = require("../model/customerModel");
const Billing = require("../model/billingModel");
const Payment = require("../model/paymentModel");

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

exports.create = async (req, res) => {
    try {
        const { customerId, amountPaid, paymentMethod,status,userId } = req.body;

        const customer = await Customer.findByPk(customerId);
        if (!customer) {
            return res.status(404).json({ message: "Customer not found", status: false });
        }

        const transaction = await Transaction.create({
            CustomerId: customerId,
            UserId: userId,
            TotalAmount: amountPaid,
            PaymentMethod: paymentMethod,
            Status: status,
        });

        const email = customer.Email;

        await sendEmail(
            email,
            'Payment Confirmation - Bongao Water District',
            `Dear ${customer.Firstname} ${customer.Lastname},\n\nYour payment of PHP ${amountPaid} has been successfully processed.\n\nThank you.\nBongao Water District.`
        );

        return res.status(201).json({ message: "Transaction created successfully", status: true,transaction });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error creating transaction", status: false, error: error.message });
    }
};

exports.getAll = async (req, res) => {
    try {
        const transactions = await Transaction.findAll({
            include: [
                { model: Customer, as: "Customer" }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ message: "Success", status: true, transactions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed", status: false, error: error.message, transactions: [] });
    }
};

exports.getUserTransaction = async (req, res) => {
    try {
        const userId = req.params.userId;
        const transactions = await Transaction.findAll({
            where: {
                UserId: userId
            },
            include: [
                { model: Customer, as: "Customer"}
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ message: "Success", status: true, transactions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed", status: false, error: error.message, transactions: [] });
    }
};


exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await Transaction.findByPk(id, { include: [Customer, Billing, Payment] });
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found", status: false });
        }
        res.status(200).json({ message: "Transaction found", status: true, transaction });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving transaction", error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { amountPaid, paymentMethod, status } = req.body;

        const transaction = await Transaction.findByPk(id);
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found", status: false });
        }

        await transaction.update({
            AmountPaid: amountPaid,
            PaymentMethod: paymentMethod,
            Status: status
        });

        res.status(200).json({ message: "Transaction updated successfully", status: true });
    } catch (error) {
        res.status(500).json({ message: "Error updating transaction", error: error.message, status: false });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await Transaction.findByPk(id);
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found", status: false });
        }
        await transaction.destroy();
        res.status(200).json({ message: "Transaction deleted successfully", status: true });
    } catch (error) {
        res.status(500).json({ message: "Error deleting transaction", error: error.message, status: false });
    }
};


// const router = express.Router();

// // Create a new transaction
// router.post('/', async (req, res) => {
//     try {
//         const { customerId, billingId, paymentId, totalAmount, status } = req.body;
        
//         // Ensure related entities exist
//         const customer = await Customer.findById(customerId);
//         const billing = await Billing.findById(billingId);
//         const payment = await Payment.findById(paymentId);

//         if (!customer || !billing || !payment) {
//             return res.status(400).json({ message: 'Invalid customer, billing, or payment ID' });
//         }

//         const transaction = new Transaction({
//             customer: customerId,
//             billing: billingId,
//             payment: paymentId,
//             totalAmount,
//             status,
//         });
        
//         await transaction.save();
//         res.status(201).json(transaction);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// });

// // Get all transactions
// router.get('/', async (req, res) => {
//     try {
//         const transactions = await Transaction.find().populate('customer billing payment');
//         res.json(transactions);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// });

// // Get a single transaction
// router.get('/:id', async (req, res) => {
//     try {
//         const transaction = await Transaction.findById(req.params.id).populate('customer billing payment');
//         if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
//         res.json(transaction);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// });

// // Update a transaction
// router.put('/:id', async (req, res) => {
//     try {
//         const { totalAmount, status } = req.body;
//         const transaction = await Transaction.findByIdAndUpdate(
//             req.params.id,
//             { totalAmount, status },
//             { new: true }
//         );
//         if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
//         res.json(transaction);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// });

// // Delete a transaction
// router.delete('/:id', async (req, res) => {
//     try {
//         const transaction = await Transaction.findByIdAndDelete(req.params.id);
//         if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
//         res.json({ message: 'Transaction deleted successfully' });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// });

// module.exports = router;
