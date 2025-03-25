const verifyToken = require("../middleware/authJWT");
const billingController = require("../controller/billingController");
const reminderController = require("../controller/reminderController")

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    app.get("/api/auth/billing", [verifyToken], billingController.getAllBillings);
    app.get("/api/auth/billing/:year/:month", [verifyToken], billingController.getBillingByMonthAndYear);
    app.get("/api/auth/billing/year/month/:customerId", [verifyToken], billingController.getCustomerBillingByMonthAndYear);
    app.get("/api/auth/billing/search/value/customer/:searchValue", [verifyToken], billingController.getCustomerBillingByName);
    app.put("/api/auth/billing/:id", [verifyToken], billingController.updateBilling);
    app.post("/api/auth/billing/:id", [verifyToken], billingController.updateBillings);
    //app.get("/api/auth/billing/customer/:customerId", [verifyToken], billingController.getAllCustomerBillings);
    app.get("/api/auth/history/:customerId", [verifyToken], billingController.getAllCustomerBillings)
    app.get("/api/auth/history", [verifyToken], billingController.getAllPaidBillings)

    app.post("/api/auth/reminder", [verifyToken], reminderController.sendDueDateReminders)
};
