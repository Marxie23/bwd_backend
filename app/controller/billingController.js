const nodemailer = require('nodemailer');
require('dotenv').config();

const { Op, Sequelize } = require("sequelize");
const MeterReading = require("../model/meterreadingModel");
const Billing = require("../model/billingModel");
const Customer = require("../model/customerModel");
const Meter = require("../model/meterModel");
//const billingController = require("../controller/emailController");

// Configure Nodemailer transporter
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
// Create a new billing record
exports.createBilling = async (req, res) => {
    try {
        const { BillingDate, DueDate, AmountDue, CustomerID } = req.body;

        const newBilling = await Billing.create({
            BillingDate,
            DueDate,
            AmountDue,
            AmountPaid: 0, // Default to zero
            PaymentStatus: "Pending",
            CustomerID,
        });
        const customer = await Customer.findByPk(CustomerID);
        const email = customer.Email;

        if (newBilling && customer) {
        // Send email notification to the customer
        await sendEmail(
            email,
            'New Billing Record Created',
            `Dear ${customer.Name},\n\nA new billing record has been created:\n\nAmount Due: ${AmountDue}\nDue Date: ${new Date(DueDate).toLocaleDateString()}\n\nThank you.\nBongao Water District`
        );
        }

        res.status(201).json({
            message: "Billing record created successfully",
            data: newBilling,
        });
    } catch (error) {
        console.error("Error creating billing record:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


// Retrieve all billing records
exports.getAllBillings = async (req, res) => {
    try {
        const billings = await Billing.findAll({
            include: {
                model: Customer,
                as: "Customer",
            },
            include:{
                model: Meter,
                as: "Meter"
            }
        });
        res.status(200).json({
            message: "All billing records retrieved successfully",
            billings,
        });
    } catch (error) {
        console.error("Error fetching billing records:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Retrieve a single billing record by ID
exports.getBillingById = async (req, res) => {
    try {
        const { id } = req.params;

        const billing = await Billing.findOne({
            where: { BillingID: id },
            include: {
                model: Customer,
                as: "Customer",
                attributes: ["CustomerID", "Name", "Email"],
            },
        });

        if (!billing) {
            return res.status(404).json({ message: "Billing record not found" });
        }

        res.status(200).json({
            message: "Billing record retrieved successfully",
            data: billing,
        });
    } catch (error) {
        console.error("Error fetching billing record:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Update a billing record
exports.updateBilling = async (req, res) => {
    try {
        const { id } = req.params;

        // BillingDate,
        // DueDate,
        // AmountDue,
        // AmountPaid: 0, // Default to zero
        // PaymentStatus: "Pending",
        const {PaymentDate,PaymentType,AmountPaid, PaymentStatus } = req.body;

        const billing = await Billing.findByPk(id);
        if (!billing) {
            return res.status(404).json({ message: "Billing record not found" });
        }
        // Update fields
        billing.PaymentStatus = PaymentStatus || billing.PaymentStatus;
        billing.AmountPaid = AmountPaid || billing.AmountPaid;
        billing.PaymentDate = PaymentDate || billing.PaymentDate;
        billing.PaymentType = PaymentType || billing.PaymentType;

        await billing.save();

        res.status(200).json({
            message: "Billing record updated successfully",
            data: billing,
        });
    } catch (error) {
        console.error("Error updating billing record:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Delete a billing record
exports.deleteBilling = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await Billing.destroy({ where: { BillingID: id } });

        if (!deleted) {
            return res.status(404).json({ message: "Billing record not found" });
        }

        res.status(200).json({
            message: "Billing record deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting billing record:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Mark a billing record as paid
exports.markAsPaid = async (req, res) => {
    try {
        const { id } = req.params;

        const billing = await Billing.findByPk(id);
        if (!billing) {
            return res.status(404).json({ message: "Billing record not found" });
        }

        if (billing.PaymentStatus === "Paid") {
            return res.status(400).json({ message: "Billing record is already marked as paid" });
        }

        billing.AmountPaid = billing.AmountDue; // Mark full payment
        billing.PaymentStatus = "Paid";
        await billing.save();

        res.status(200).json({
            message: "Billing record marked as paid successfully",
            data: billing,
        });
    } catch (error) {
        console.error("Error marking billing as paid:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getBillingByMonthAndYear = async (req, res) => {
    const { year, month } = req.params;
    
    try{
        const billingInfo = await Billing.findAll({
            where:{
                [Op.and]: [
                    Sequelize.where(Sequelize.fn("YEAR", Sequelize.col("BillingDate")), year),
                    Sequelize.where(Sequelize.fn("MONTH", Sequelize.col("BillingDate")), month),
                ],
                // PaymentStatus:"Unpaid"
            },
            include: [
                {
                    model: Customer,
                    as: "Customer"
                },
                {
                    model: MeterReading,
                    as: "MeterReading",
                    include:[
                        {
                            model: Meter,
                            as: "Meter"
                        }
                    ]
                }
            ],
            order: [[{ model: Customer, as: 'Customer' }, 'Lastname', 'ASC']]
        });
        if(billingInfo.length === 0){
            return res.status(404).json({
                status: false,
                message: "No billing Info found for the specified month, year.",
                billingInfo: []
            });
        }

        const formattedBillingInfo = billingInfo.map(billing => {
            const customer = billing.Customer;
            const meterReading = billing.MeterReading;
            const meter = billing.MeterReading.Meter

            return {
                customer_CustomerID: customer.CustomerID,
                customer_Name: `${customer.Firstname} ${customer.Lastname}`,
                customer_AccountNumber: customer.AccountNum,
                meter_MeterNumber : meter.MeterNumber,
                reading_MeterReadingID: meterReading.MeterReadingID,
                reading_PeriodStart: new Date(meterReading.PeriodStart).toLocaleDateString(),
                reading_PeriodEnd: new Date(meterReading.PeriodEnd).toLocaleDateString(),
                reading_ReadingDate: new Date(meterReading.ReadingDate).toLocaleDateString(),
                reading_PresentReading: meterReading.PresentReading,
                reading_PreviousReading: meterReading.PreviousReading,
                reading_Consumption: meterReading.Consumption,
                reading_ReaderName: meterReading.ReaderName,
                billing_BillingID: billing.BillingID,
                billing_BillingDate: new Date(billing.BillingDate).toLocaleDateString(),
                billing_DueDate: new Date(billing.DueDate).toLocaleDateString(),
                billing_AmountDue: billing.AmountDue,
                billing_AmountAfterDue: billing.AmountAfterDue,
                billing_AmountPaid: billing.AmountPaid,
                billing_PaymentStatus: billing.PaymentStatus,
                billing_ReferenceNumber: billing.ReferenceNumber,
                billing_CurrentBill: billing.CurrentBill,
                billing_FCACharge: billing.FCACharge,
                billing_PaymentDate: billing.PaymentDate ? new Date(billing.PaymentDate).toLocaleDateString() : null,
                billing_PaymentType: billing.PaymentType,

            };
        });

        return res.status(200).json({
            status: true,
            message: "Meter readings found for the specified month, year.",
            billingInfo: formattedBillingInfo
        });
    }catch (error){
        console.error("Error fetching billing by month, year, and MeterId:", error.message);
        return res.status(500).json({
            status: false,
            message: "An error occurred while fetching billing.",
            billingInfo: []
        });
    }
}
exports.getCustomerBillingByMonthAndYear = async (req, res) => {
    const {customerId } = req.params;
    try{
        const billingInfo = await Billing.findAll({
            where:{
                CustomerID: customerId
            },
            include: [
                {
                    model: Customer,
                    as: "Customer"
                },
                {
                    model: MeterReading,
                    as: "MeterReading",
                    include:[
                        {
                            model: Meter,
                            as: "Meter"
                        }
                    ]
                }
            ],
            order: [[{ model: Customer, as: 'Customer' }, 'Lastname', 'ASC']]
        });
        if(billingInfo.length === 0){
            return res.status(404).json({
                status: false,
                message: "No billing Info found for the specified month, year.",
                billingInfo: []
            });
        }

        const formattedBillingInfo = billingInfo.map(billing => {
            const customer = billing.Customer;
            const meterReading = billing.MeterReading;
            const meter = billing.MeterReading.Meter

            return {
                customer_CustomerID: customer.CustomerID,
                customer_Name: `${customer.Firstname} ${customer.Lastname}`,
                customer_AccountNumber: customer.AccountNum,
                meter_MeterNumber : meter.MeterNumber,
                reading_MeterReadingID: meterReading.MeterReadingID,
                reading_PeriodStart: new Date(meterReading.PeriodStart).toLocaleDateString(),
                reading_PeriodEnd: new Date(meterReading.PeriodEnd).toLocaleDateString(),
                reading_ReadingDate: new Date(meterReading.ReadingDate).toLocaleDateString(),
                reading_PresentReading: meterReading.PresentReading,
                reading_PreviousReading: meterReading.PreviousReading,
                reading_Consumption: meterReading.Consumption,
                reading_ReaderName: meterReading.ReaderName,
                billing_BillingID: billing.BillingID,
                billing_BillingDate: new Date(billing.BillingDate).toLocaleDateString(),
                billing_DueDate: new Date(billing.DueDate).toLocaleDateString(),
                billing_AmountDue: billing.AmountDue,
                billing_AmountAfterDue: billing.AmountAfterDue,
                billing_AmountPaid: billing.AmountPaid,
                billing_PaymentStatus: billing.PaymentStatus,
                billing_ReferenceNumber: billing.ReferenceNumber,
                billing_CurrentBill: billing.CurrentBill,
                billing_FCACharge: billing.FCACharge,
                billing_PaymentDate: billing.PaymentDate ? new Date(billing.PaymentDate).toLocaleDateString() : null,
                billing_PaymentType: billing.PaymentType,
            };
        });

        return res.status(200).json({
            status: true,
            message: "Meter readings found for the specified month, year.",
            billingInfo: formattedBillingInfo
        });
    }catch (error){
        console.error("Error fetching billing by month, year, and MeterId:", error.message);
        return res.status(500).json({
            status: false,
            message: "An error occurred while fetching billing.",
            billingInfo: []
        });
    }
}
exports.getBillingByMonthAndYear = async (req, res) => {
    const { year, month } = req.params;
    
    try{
        const billingInfo = await Billing.findAll({
            where:{
                [Op.and]: [
                    Sequelize.where(Sequelize.fn("YEAR", Sequelize.col("BillingDate")), year),
                    Sequelize.where(Sequelize.fn("MONTH", Sequelize.col("BillingDate")), month),
                ],
                // PaymentStatus:"Unpaid"
            },
            include: [
                {
                    model: Customer,
                    as: "Customer"
                },
                {
                    model: MeterReading,
                    as: "MeterReading",
                    include:[
                        {
                            model: Meter,
                            as: "Meter"
                        }
                    ]
                }
            ],
            order: [[{ model: Customer, as: 'Customer' }, 'Lastname', 'ASC']]
        });
        if(billingInfo.length === 0){
            return res.status(404).json({
                status: false,
                message: "No billing Info found for the specified month, year.",
                billingInfo: []
            });
        }

        const formattedBillingInfo = billingInfo.map(billing => {
            const customer = billing.Customer;
            const meterReading = billing.MeterReading;
            const meter = billing.MeterReading.Meter

            return {
                customer_CustomerID: customer.CustomerID,
                customer_Name: `${customer.Firstname} ${customer.Lastname}`,
                customer_AccountNumber: customer.AccountNum,
                meter_MeterNumber : meter.MeterNumber,
                reading_MeterReadingID: meterReading.MeterReadingID,
                reading_PeriodStart: new Date(meterReading.PeriodStart).toLocaleDateString(),
                reading_PeriodEnd: new Date(meterReading.PeriodEnd).toLocaleDateString(),
                reading_ReadingDate: new Date(meterReading.ReadingDate).toLocaleDateString(),
                reading_PresentReading: meterReading.PresentReading,
                reading_PreviousReading: meterReading.PreviousReading,
                reading_Consumption: meterReading.Consumption,
                reading_ReaderName: meterReading.ReaderName,
                billing_BillingID: billing.BillingID,
                billing_BillingDate: new Date(billing.BillingDate).toLocaleDateString(),
                billing_DueDate: new Date(billing.DueDate).toLocaleDateString(),
                billing_AmountDue: billing.AmountDue,
                billing_AmountAfterDue: billing.AmountAfterDue,
                billing_AmountPaid: billing.AmountPaid,
                billing_PaymentStatus: billing.PaymentStatus,
                billing_ReferenceNumber: billing.ReferenceNumber,
                billing_CurrentBill: billing.CurrentBill,
                billing_FCACharge: billing.FCACharge,
                billing_PaymentDate: billing.PaymentDate ? new Date(billing.PaymentDate).toLocaleDateString() : null,
                billing_PaymentType: billing.PaymentType,

            };
        });

        return res.status(200).json({
            status: true,
            message: "Meter readings found for the specified month, year.",
            billingInfo: formattedBillingInfo
        });
    }catch (error){
        console.error("Error fetching billing by month, year, and MeterId:", error.message);
        return res.status(500).json({
            status: false,
            message: "An error occurred while fetching billing.",
            billingInfo: []
        });
    }
}

exports.getCustomerBillingByName = async (req, res) => {
    const {searchValue} = req.params;
    try{
        const billingInfo = await Billing.findAll({
            include: [
                {
                    model: Customer,
                    as: "Customer",
                    where:{
                        [Op.or]:[
                            { Firstname: { [Op.like]: `%${searchValue}%` } }, // Search by Firstname
                            { Lastname: { [Op.like]: `%${searchValue}%` } }, // Search by Lastname
                        ]
                    }
                },
                {
                    model: MeterReading,
                    as: "MeterReading",
                    include:[
                        {
                            model: Meter,
                            as: "Meter"
                        }
                    ]
                }
            ],
            order: [[{ model: Customer, as: 'Customer' }, 'Lastname', 'ASC']]
        });
        if(billingInfo.length === 0){
            return res.status(404).json({
                status: false,
                message: "No billing Info found for name search.",
                billingInfo: []
            });
        }

        const formattedBillingInfo = billingInfo.map(billing => {
            const customer = billing.Customer;
            const meterReading = billing.MeterReading;
            const meter = billing.MeterReading.Meter

            return {
                customer_CustomerID: customer.CustomerID,
                customer_Name: `${customer.Firstname} ${customer.Lastname}`,
                customer_AccountNumber: customer.AccountNum,
                meter_MeterNumber : meter.MeterNumber,
                reading_MeterReadingID: meterReading.MeterReadingID,
                reading_PeriodStart: new Date(meterReading.PeriodStart).toLocaleDateString(),
                reading_PeriodEnd: new Date(meterReading.PeriodEnd).toLocaleDateString(),
                reading_ReadingDate: new Date(meterReading.ReadingDate).toLocaleDateString(),
                reading_PresentReading: meterReading.PresentReading,
                reading_PreviousReading: meterReading.PreviousReading,
                reading_Consumption: meterReading.Consumption,
                reading_ReaderName: meterReading.ReaderName,
                billing_BillingID: billing.BillingID,
                billing_BillingDate: new Date(billing.BillingDate).toLocaleDateString(),
                billing_DueDate: new Date(billing.DueDate).toLocaleDateString(),
                billing_AmountDue: billing.AmountDue,
                billing_AmountAfterDue: billing.AmountAfterDue,
                billing_AmountPaid: billing.AmountPaid,
                billing_PaymentStatus: billing.PaymentStatus,
                billing_ReferenceNumber: billing.ReferenceNumber,
                billing_CurrentBill: billing.CurrentBill,
                billing_FCACharge: billing.FCACharge,
                billing_PaymentDate: billing.PaymentDate ? new Date(billing.PaymentDate).toLocaleDateString() : null,
                billing_PaymentType: billing.PaymentType,
            };
        });

        return res.status(200).json({
            status: true,
            message: "Meter readings found for the specified name.",
            billingInfo: formattedBillingInfo
        });
    }catch (error){
        console.error("Error fetching billing by name, and MeterId:", error.message);
        return res.status(500).json({
            status: false,
            message: "An error occurred while fetching billing.",
            billingInfo: []
        });
    }
}

exports.getAllCustomerBillings = async (req, res) => {
    const { customerId } = req.params;
    console.log(customerId + "dddgdgdg")
    try{
        const billingInfo = await Billing.findAll({
            where:{
                CustomerID: customerId,
                PaymentStatus:"Paid",
            },
            include: [
                {
                    model: Customer,
                    as: "Customer"
                },
                {
                    model: MeterReading,
                    as: "MeterReading",
                    include:[
                        {
                            model: Meter,
                            as: "Meter"
                        }
                    ]
                }
            ],
            order: [[{ model: MeterReading, as: 'MeterReading' }, 'ReadingDate', 'DESC']]
        });
        if(billingInfo.length === 0){
            return res.status(404).json({
                status: false,
                message: "No billing Info found.",
                billingInfo: []
            });
        }

        const formattedBillingInfo = billingInfo.map(billing => {
            const customer = billing.Customer;
            const meterReading = billing.MeterReading;
            const meter = billing.MeterReading.Meter

            return {
                customer_CustomerID: customer.CustomerID,
                customer_Name: `${customer.Firstname} ${customer.Lastname}`,
                customer_AccountNumber: customer.AccountNum,
                meter_MeterNumber : meter.MeterNumber,
                reading_MeterReadingID: meterReading.MeterReadingID,
                reading_PeriodStart: new Date(meterReading.PeriodStart).toLocaleDateString(),
                reading_PeriodEnd: new Date(meterReading.PeriodEnd).toLocaleDateString(),
                reading_ReadingDate: new Date(meterReading.ReadingDate).toLocaleDateString(),
                reading_PresentReading: meterReading.PresentReading,
                reading_PreviousReading: meterReading.PreviousReading,
                reading_Consumption: meterReading.Consumption,
                billing_BillingID: billing.BillingID,
                billing_BillingDate: new Date(billing.BillingDate).toLocaleDateString(),
                billing_DueDate: new Date(billing.DueDate).toLocaleDateString(),
                billing_AmountDue: billing.AmountDue,
                billing_AmountAfterDue: billing.AmountAfterDue,
                billing_AmountPaid: billing.AmountPaid,
                billing_PaymentStatus: billing.PaymentStatus,
                billing_ReferenceNumber: billing.ReferenceNumber,
                billing_PaymentType: billing.PaymentType,
            };
        });

        return res.status(200).json({
            status: true,
            message: "Billing found.",
            billingInfo: formattedBillingInfo
        });
    }catch (error){
        console.error("Error fetching billing:", error.message);
        return res.status(500).json({
            status: false,
            message: "An error occurred while fetching billing.hhhmh",
            billingInfo: []
        });
    }
};

exports.getAllPaidBillings = async (req, res) => {

    try{
        const billingInfo = await Billing.findAll({
            where:{
                PaymentStatus:"Paid",
            },
            include: [
                {
                    model: Customer,
                    as: "Customer"
                },
                {
                    model: MeterReading,
                    as: "MeterReading",
                    include:[
                        {
                            model: Meter,
                            as: "Meter"
                        }
                    ]
                }
            ],
            order: [[{ model: MeterReading, as: 'MeterReading' }, 'ReadingDate', 'DESC']]
        });
        if(billingInfo.length === 0){
            return res.status(404).json({
                status: false,
                message: "No billing Info found.",
                billingInfo: []
            });
        }

        const formattedBillingInfo = billingInfo.map(billing => {
            const customer = billing.Customer;
            const meterReading = billing.MeterReading;
            const meter = billing.MeterReading.Meter

            return {
                customer_CustomerID: customer.CustomerID,
                customer_Name: `${customer.Firstname} ${customer.Lastname}`,
                customer_AccountNumber: customer.AccountNum,
                meter_MeterNumber : meter.MeterNumber,
                reading_MeterReadingID: meterReading.MeterReadingID,
                reading_PeriodStart: new Date(meterReading.PeriodStart).toLocaleDateString(),
                reading_PeriodEnd: new Date(meterReading.PeriodEnd).toLocaleDateString(),
                reading_ReadingDate: new Date(meterReading.ReadingDate).toLocaleDateString(),
                reading_PresentReading: meterReading.PresentReading,
                reading_PreviousReading: meterReading.PreviousReading,
                reading_Consumption: meterReading.Consumption,
                reading_ReaderName: meterReading.ReaderName,
                billing_BillingID: billing.BillingID,
                billing_BillingDate: new Date(billing.BillingDate).toLocaleDateString(),
                billing_DueDate: new Date(billing.DueDate).toLocaleDateString(),
                billing_AmountDue: billing.AmountDue,
                billing_AmountAfterDue: billing.AmountAfterDue,
                billing_AmountPaid: billing.AmountPaid,
                billing_PaymentStatus: billing.PaymentStatus,
                billing_ReferenceNumber: billing.ReferenceNumber,
                billing_CurrentBill: billing.CurrentBill,
                billing_FCACharge: billing.FCACharge,
                billing_PaymentDate: billing.PaymentDate ? new Date(billing.PaymentDate).toLocaleDateString() : null,
                billing_PaymentType: billing.PaymentType,
            };
        });

        return res.status(200).json({
            status: true,
            message: "Billing found.",
            billingInfo: formattedBillingInfo
        });
    }catch (error){
        console.error("Error fetching billing:", error.message);
        return res.status(500).json({
            status: false,
            message: "An error occurred while fetching billing.hhhmh",
            billingInfo: []
        });
    }
};

exports.updateBillings = async (req, res) => {

    try {
        const transaction = await Billing.sequelize.transaction();
        const transactionMeterReading = await MeterReading.sequelize.transaction();
        const { id } = req.params;
        const { BillingDate, DueDate, AmountDue, AmountPaid, PaymentStatus, PresentReading, PreviousReading, Consumption, amountAfterDues,fcaCharges,readerNames,currentBills} = req.body;

        // Find Billing Record
        const billing = await Billing.findByPk(id, { transaction });

        if (!billing) {
            return res.status(404).json({ message: "Billing record not found" });
        }

        // Fetch Associated MeterReading Record
        const meterReading = await MeterReading.findByPk(billing.MeterReadingID);

        if (!meterReading) {
            return res.status(404).json({ message: "Meter reading record not found for this billing", status:false});
        }

        meterReading.ReaderName = readerNames || meterReading.ReaderName;

        await meterReading.save({transactionMeterReading});
        // ✅ Update Billing Fields
        billing.BillingDate = BillingDate || billing.BillingDate;
        billing.DueDate = DueDate || billing.DueDate;
        billing.AmountDue = AmountDue || billing.AmountDue;
        billing.AmountPaid = AmountPaid || billing.AmountPaid;
        billing.PaymentStatus = PaymentStatus || billing.PaymentStatus;
        billing.AmountAfterDue = amountAfterDues || billing.AmountAfterDue;
        billing.FCACharge = fcaCharges || billing.FCACharge;
        billing.CurrentBill = fcaCharges || billing.CurrentBill;

        await billing.save({ transaction });

        // ✅ Update Meter Reading Fields
        meterReading.PresentReading = PresentReading || meterReading.PresentReading;
        meterReading.PreviousReading = PreviousReading || meterReading.PreviousReading;
        meterReading.Consumption = Consumption || meterReading.Consumption;

        await meterReading.save({ transaction });

        // Commit transaction
        await transaction.commit();

        res.status(200).json({
            message: "Billing and meter reading records updated successfully",
            status:true,
            data: { billing, meterReading },
        });

    } catch (error) {
        // Rollback transaction if any error occurs
        await transaction.rollback();
        console.error("Error updating billing and meter reading:", error);
        res.status(500).json({ message: "Server error", error: error.message, status:false });
    }
};