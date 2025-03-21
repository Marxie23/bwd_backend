const nodemailer = require('nodemailer');
require('dotenv').config();

const { Op, Sequelize } = require("sequelize");
const MeterReading = require("../model/meterreadingModel");
const Meter = require("../model/meterModel");
const Billing = require("../model/billingModel");
const Customer = require("../model/customerModel")
const User = require("../model/userModel")

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp-mail.outlook.com',
    port: 587,
    secureConnection: false,
    tls: {
        ciphers:'SSLv3'
    },
    requireTLS:true,//this parameter solved problem for me
    auth: {
      user: 'bongaowaterdistrictmarxie@gmail.com',
      pass: 'uhfy ajkh nvjs bczy',
    },
    logger: true, // Enable logging
    debug: true, 
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
    } catch (error) {
      console.error('Error sending email:', error.message);
    }
  };

// Create a new meter reading
exports.create = async (req, res) => {
    try {
        const { periodStart, periodEnd, readingDate, presentReading, previousReading, meterId, consumption} = req.body;
        const { customerId, amountDue, amountAfterDue, dueDate} = req.body;
        const monthNames = [
            "January", "February", "March", "April", "May", "June", 
            "July", "August", "September", "October", "November", "December"
          ];

        if (!meterId || !customerId || !periodStart || !periodEnd || !dueDate || !readingDate || !presentReading || !previousReading || !consumption || !amountDue || !amountAfterDue) {
            return res.status(400).json({
                status: false,
                message: "All fields must be filled!",
                meterReading:[]
            })
          }
        const newMeterReading = await MeterReading.create({
            PeriodStart : periodStart,
            PeriodEnd : periodEnd,
            ReadingDate : readingDate,
            PresentReading : presentReading,
            PreviousReading : previousReading,
            Consumption: consumption,
            MeterId : meterId,
        });
        
        const meterReadingID = newMeterReading.MeterReadingID;
        const newBilling = await Billing.create({
            BillingDate : readingDate,
            DueDate : dueDate,
            AmountDue : amountDue,
            AmountAfterDue : amountAfterDue,
            CustomerID: customerId,
            MeterReadingID : meterReadingID,
        });
        const billingID = newBilling.BillingID
        const customer = await Customer.findByPk(customerId);
        const user = await User.findOne({ where: {CustomerId: customerId}})
        const rMonth = new Date(readingDate)
        const month = await rMonth.getMonth();
        const monthName = await monthNames[month]
        // if (customer && newBilling) {
        //     const email = customer.Email
        //     const fullName = `${customer.Firstname} ${customer.Middlename ? `${customer.Middlename}.` : ""} ${customer.Lastname}`;
        //     await sendEmail(
        //         email,
        //         `Billing Notice`,
        //         `Dear Mr/Mrs.${fullName},\n\nYou have a bill for the month of ${monthName}:\n\nReading Date: ${new Date(readingDate).toLocaleDateString()}\nAmount Due: ${amountDue}\nConsumption: ${consumption}\nDue Date: ${new Date(dueDate).toLocaleDateString()}\n\nThank you.\nBongao Water District Website Billing`
        //     );
        // }

        let meterReading ={
            meterReadingID,
            billingID,
            customer,
            user
        }
        res.status(201).json({
            status: true,
            message: "Meter reading created successfully",
            meterReading
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: "Failed to create meter reading",
            error: error.message,
            meterReading:[]
        });
    }
};

// Retrieve all meter readings
exports.getAll = async (req, res) => {
    try {
        const meterReadings = await MeterReading.findAll({
            include: [
                {
                    model: Meter,
                    as: "Meter",
                },
            ],
        });

        res.status(200).json({
            success: true,
            meterReadings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve meter readings",
            error: error.message,
        });
    }
};

// Retrieve a single meter reading by ID
exports.getMeterReadingById = async (req, res) => {
    try {
        const { id } = req.params;
        const meterReading = await MeterReading.findByPk(id, {
            include: [
                {
                    model: Meter,
                    as: "Meter",
                },
            ],
        });

        if (!meterReading) {
            return res.status(404).json({
                success: false,
                message: "Meter reading not found",
            });
        }

        res.status(200).json({
            success: true,
            data: meterReading,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve meter reading",
            error: error.message,
        });
    }
};

// Update a meter reading
exports.updateMeterReading = async (req, res) => {
    try {
        const { id } = req.params;
        const { PeriodStart, PeriodEnd, ReadingDate, PresentReading, PreviousReading, MeterId } = req.body;

        // Find the existing record
        const meterReading = await MeterReading.findByPk(id);
        if (!meterReading) {
            return res.status(404).json({
                success: false,
                message: "Meter reading not found",
            });
        }

        // Calculate new consumption if readings are updated
        const Consumption = PresentReading && PreviousReading ? PresentReading - PreviousReading : meterReading.Consumption;

        const updatedMeterReading = await meterReading.update({
            PeriodStart,
            PeriodEnd,
            ReadingDate,
            PresentReading,
            PreviousReading,
            Consumption,
            MeterId,
        });

        res.status(200).json({
            success: true,
            message: "Meter reading updated successfully",
            data: updatedMeterReading,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update meter reading",
            error: error.message,
        });
    }
};

// Delete a meter reading
exports.deleteMeterReading = async (req, res) => {
    try {
        const { id } = req.params;

        const meterReading = await MeterReading.findByPk(id);
        if (!meterReading) {
            return res.status(404).json({
                success: false,
                message: "Meter reading not found",
            });
        }

        await meterReading.destroy();

        res.status(200).json({
            success: true,
            message: "Meter reading deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete meter reading",
            error: error.message,
        });
    }
};

exports.getMeterReadingsByMonthYearAndMeterId = async (req, res) => {

    const { year, month, meterId } = req.params; // Expect year, month, and meterId as route parameters

    try {
        // Fetch meter readings matching the specified year, month, and MeterId
        const meterReadings = await MeterReading.findAll({
            where: {
                [Op.and]: [
                    Sequelize.where(Sequelize.fn("YEAR", Sequelize.col("ReadingDate")), year),
                    Sequelize.where(Sequelize.fn("MONTH", Sequelize.col("ReadingDate")), month),
                    { MeterId: meterId } // Match the MeterId
                ],
            },
            include: [
                {
                    model: Meter,
                    as: "Meter",
                },
            ],
        });

        // Check if any records are found
        if (meterReadings.length === 0) {
            return res.status(404).json({
                status: false,
                message: "No meter readings found for the specified month, year.",
                meterReadings: ""
            });
        }

        return res.status(200).json({
            status: true,
            message: "Meter readings found for the specified month, year.",
            meterReadings
        });
    } catch (error) {
        console.error("Error fetching meter readings by month, year, and MeterId:", error.message);
        return res.status(500).json({
            status: false,
            message: "An error occurred while fetching meter readings.",
            meterReadings: ""
        });
    }
};

exports.getMeterReadingsByMonthYear = async (req, res) => {

    const { year, month } = req.params; // Expect year, month, and meterId as route parameters

    try {
        // Fetch meter readings matching the specified year, month, and MeterId
        const meterReadings = await MeterReading.findAll({
            where: {
                [Op.and]: [
                    Sequelize.where(Sequelize.fn("YEAR", Sequelize.col("ReadingDate")), year),
                    Sequelize.where(Sequelize.fn("MONTH", Sequelize.col("ReadingDate")), month)
                ],
            },
            include: [
                {
                    model: Meter,
                    as: "Meter",
                    include: [{
                        model: Customer,
                        as: "Customer",
                    }],
                    order: [[{ model: Customer, as: 'Customer' }, 'Lastname', 'ASC']]
                },
            ],
        });

        // Check if any records are found
        if (meterReadings.length === 0) {
            return res.status(404).json({
                status: false,
                message: "No meter readings found for the specified month, year.",
                meterReadings: []
            });
        }

        const formattedReadings = meterReadings.map(readings => {
            const meter = readings.Meter;
            const customer = readings.Meter.Customer;
            return {
                reading_ID: readings.MeterReadingID,
                reading_PeriodStart: new Date(readings.PeriodStart).toLocaleDateString(),
                reading_PerriodEnd: new Date(readings.PeriodEnd).toLocaleDateString(),
                reading_ReadingDate: new Date(readings.ReadingDate).toLocaleDateString(),
                reading_PresentReading: readings.PresentReading,
                reading_PreviousReading: readings.PreviousReading,
                reading_Consumption: readings.Consumption,
                meter_meterID: meter.MeterID,
                meter_meterNo: meter.MeterNumber,
                customer_customerID: customer.CustomerID,
                customer_fullName: `${customer.Firstname} ${customer.Middlename ? `${customer.Middlename}.` : ""} ${customer.Lastname}`,
                customer_accountNumber: customer.AccountNum,
                customer_address: customer.Address,
                status: meter.Status
            }
        })

        return res.status(200).json({
            status: true,
            message: "Meter readings found for the specified month, year.",
            meterReadings: formattedReadings
        });
    } catch (error) {
        console.error("Error fetching meter readings by month, year, and MeterId:", error.message);
        return res.status(500).json({
            status: false,
            message: "An error occurred while fetching meter readings.",
            meterReadings: []
        });
    }
};

exports.updateMeterReadings = async (req, res) => {
    try {
        const { id } = req.params; // Get the meter reading ID from the request params
        const { periodStart, periodEnd, readingDate, presentReading, previousReading, meterId, consumption, 
                customerId, amountDue, amountAfterDue, dueDate } = req.body;

        // Check if meter reading exists
        const meterReading = await MeterReading.findByPk(id);
        if (!meterReading) {
            return res.status(404).json({ status: false, message: "Meter reading not found!" });
        }

        // Find associated billing record
        const billing = await Billing.findOne({ where: { MeterReadingID: id } });
        if (!billing) {
            return res.status(404).json({ status: false, message: "Billing record not found!" });
        }

        // Validate foreign keys
        const meter = await Meter.findByPk(meterId);
        const customer = await Customer.findByPk(customerId);

        if (!meter) {
            return res.status(400).json({ status: false, message: "Invalid meter ID" });
        }
        if (!customer) {
            return res.status(400).json({ status: false, message: "Invalid customer ID" });
        }


        await meterReading.update({
            PeriodStart: periodStart,
            PeriodEnd: periodEnd,
            ReadingDate: readingDate,
            PresentReading: presentReading,
            PreviousReading: previousReading,
            Consumption: consumption,
            MeterId: meterId,
        })
        await billing.update({
            BillingDate: readingDate,
            DueDate: dueDate,
            AmountDue: amountDue,
            AmountAfterDue: amountAfterDue,
            CustomerID: customerId,
        })

        res.status(200).json({
            status: true,
            message: "Meter reading updated successfully",
        });

    } catch (error) {
        res.status(500).json({
            status: false,
            message: "Failed to update meter reading",
            error: error.message,
        });
    }
};


exports.getMeterReadingAndBillingByMonthYear = async (req, res) => {
    const { year, month } = req.params; // Expect year, month as route parameters

    try {
        // Fetch Billing records where the associated MeterReading matches the specified year and month
        const billings = await Billing.findAll({
            include: [
                {
                    model: MeterReading,
                    as: "MeterReading",
                    where: {
                        [Op.and]: [
                            Sequelize.where(Sequelize.fn("YEAR", Sequelize.col("MeterReading.ReadingDate")), year),
                            Sequelize.where(Sequelize.fn("MONTH", Sequelize.col("MeterReading.ReadingDate")), month)
                        ],
                    },
                    include: [
                        {
                            model: Meter,
                            as: "Meter",
                            include: [
                                {
                                    model: Customer,
                                    as: "Customer",
                                },
                            ],
                        },
                    ],
                },
            ],
            order: [[{ model: MeterReading, as: "MeterReading" }, { model: Meter, as: "Meter" }, { model: Customer, as: "Customer" }, "Lastname", "ASC"]],
        });

        // Check if any records are found
        if (billings.length === 0) {
            return res.status(404).json({
                status: false,
                message: "No billing records found for the specified month and year.",
                billings: []
            });
        }

        // Format the response data
        const formattedBillings = billings.map(billing => {
            const meterReading = billing.MeterReading;
            const meter = meterReading.Meter;
            const customer = meter.Customer;

            return {
                billing_ID: billing.BillingID,
                billing_Date: new Date(billing.BillingDate).toLocaleDateString(),
                billing_DueDate: new Date(billing.DueDate).toLocaleDateString(),
                billing_AmountDue: billing.AmountDue,
                billing_AmountAfterDue: billing.AmountAfterDue,
                billing_AmountPaid: billing.AmountPaid,
                billing_PaymentStatus: billing.PaymentStatus,
                billing_ReferenceNumber: billing.ReferenceNumber,
                reading_ID: meterReading.MeterReadingID,
                reading_PeriodStart: new Date(meterReading.PeriodStart).toLocaleDateString(),
                reading_PeriodEnd: new Date(meterReading.PeriodEnd).toLocaleDateString(),
                reading_ReadingDate: new Date(meterReading.ReadingDate).toLocaleDateString(),
                reading_PresentReading: meterReading.PresentReading,
                reading_PreviousReading: meterReading.PreviousReading,
                reading_Consumption: meterReading.Consumption,
                meter_meterID: meter.MeterID,
                meter_meterNo: meter.MeterNumber,
                customer_customerID: customer.CustomerID,
                customer_fullName: `${customer.Firstname} ${customer.Middlename ? `${customer.Middlename}.` : ""} ${customer.Lastname}`,
                customer_accountNumber: customer.AccountNum,
                customer_address: customer.Address,
                status: meter.Status
            };
        });

        return res.status(200).json({
            status: true,
            message: "Billing records found for the specified month and year.",
            billings: formattedBillings
        });

    } catch (error) {
        console.error("Error fetching billing records by month and year:", error.message);
        return res.status(500).json({
            status: false,
            message: "An error occurred while fetching billing records.",
            billings: []
        });
    }
};



exports.getMeterReadingAndBillingByMonthYearAndMeterID = async (req, res) => {

    const { year, month, meterId } = req.params; // Expect year, month, and meterId as route parameters

    try {
        // Fetch meter readings matching the specified year, month, and MeterId
        const meterReadings = await Billing.findAll({
            include:[
                {
                    model: MeterReading,
                    as: "MeterReading",
                    where:{
                        [Op.and]: [
                        Sequelize.where(Sequelize.fn("YEAR", Sequelize.col("ReadingDate")), year),
                        Sequelize.where(Sequelize.fn("MONTH", Sequelize.col("ReadingDate")), month),
                        { MeterId: meterId } // Match the MeterId
                    ],
                    },
                    include:[
                        {
                            model: Meter,
                            as: "Meter"
                        }
                    ]
                }
            ]
            // where: {
            //     [Op.and]: [
            //         Sequelize.where(Sequelize.fn("YEAR", Sequelize.col("ReadingDate")), year),
            //         Sequelize.where(Sequelize.fn("MONTH", Sequelize.col("ReadingDate")), month),
            //         { MeterId: meterId } // Match the MeterId
            //     ],
            // },
            // include: [
            //     {
            //         model: Meter,
            //         as: "Meter",
            //     },
            // ],
        });

        // Check if any records are found
        if (meterReadings.length === 0) {
            return res.status(404).json({
                status: false,
                message: "No meter readings found for the specified month, year.",
                meterReadings: ""
            });
        }

        return res.status(200).json({
            status: true,
            message: "Meter readings found for the specified month, year.",
            meterReadings
        });
    } catch (error) {
        console.error("Error fetching meter readings by month, year, and MeterId:", error.message);
        return res.status(500).json({
            status: false,
            message: "An error occurred while fetching meter readings.",
            meterReadings: ""
        });
    }
};