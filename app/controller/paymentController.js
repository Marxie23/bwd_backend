const Payment = require("../model/paymentModel");
const Billing = require("../model/billingModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)

// Controller functions
const PaymentController = {

    openPaymentMethod: async (req, res) => {
        try{
            const { BillingID } = req.body;

            // Check if the BillingID exists
            const billing = await Billing.findByPk(BillingID);
            if (!billing) {
                return res.status(404).json({ message: "Billing record not found" });
            }
            const exchangeRate = 0.018; // Example: 1 PHP = 0.018 USD
            const amountInUSD = Math.round(billing.AmountDue * exchangeRate * 100); // Convert and round to cents
            
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                mode: "payment",
                line_items: [ // Wrap the object inside an array
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: `Billing for the month of ${billing.BillingDate}`
                            },
                            unit_amount: amountInUSD,
                        },
                        quantity: 1
                    }
                ],
                success_url: `${process.env.SERVER_URL}/success`,
                cancel_url: `${process.env.SERVER_URL}/error`
            });
            
            res.status(200).json({url: session.url, status: true })
        }catch (error){
            res.status(500).json({error: error.message, status: false})
        }
    },
    // Create a new paymenty
    createPayment: async (req, res) => {
        try {
            const { BillingID, PaymentDate, Amount, PaymentMethod, ReferenceNumber } = req.body;

            // Check if the BillingID exists
            const billing = await Billing.findByPk(BillingID);
            if (!billing) {
                return res.status(404).json({ message: "Billing record not found" });
            }
            // Create a new payment
            const payment = await Payment.create({
                BillingID,
                PaymentDate,
                Amount,
                PaymentMethod,
                ReferenceNumber,
            });

            res.status(201).json({ message: "Payment created successfully", payment });
        } catch (error) {
            console.error("Error creating payment:", error);
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    // Retrieve all payments
    getAllPayments: async (req, res) => {
        try {
            const payments = await Payment.findAll({ include: [{ model: Billing, as: "Billing" }] });
            res.status(200).json(payments);
        } catch (error) {
            console.error("Error fetching payments:", error);
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    // Retrieve a single payment by ID
    getPaymentById: async (req, res) => {
        try {
            const { id } = req.params;
            const payment = await Payment.findByPk(id, { include: [{ model: Billing, as: "Billing" }] });

            if (!payment) {
                return res.status(404).json({ message: "Payment not found" });
            }

            res.status(200).json(payment);
        } catch (error) {
            console.error("Error fetching payment:", error);
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    // Update a payment
    updatePayment: async (req, res) => {
        try {
            const { id } = req.params;
            const { PaymentDate, Amount, PaymentMethod, ReferenceNumber } = req.body;

            const payment = await Payment.findByPk(id);

            if (!payment) {
                return res.status(404).json({ message: "Payment not found" });
            }

            await payment.update({
                PaymentDate,
                Amount,
                PaymentMethod,
                ReferenceNumber,
            });

            res.status(200).json({ message: "Payment updated successfully", payment });
        } catch (error) {
            console.error("Error updating payment:", error);
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    // Delete a payment
    deletePayment: async (req, res) => {
        try {
            const { id } = req.params;
            const payment = await Payment.findByPk(id);

            if (!payment) {
                return res.status(404).json({ message: "Payment not found" });
            }

            await payment.destroy();
            res.status(200).json({ message: "Payment deleted successfully" });
        } catch (error) {
            console.error("Error deleting payment:", error);
            res.status(500).json({ message: "Internal server error", error });
        }
    },
};

module.exports = PaymentController;
