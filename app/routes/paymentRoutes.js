const verifyToken = require("../middleware/authJWT");
const paymentController = require("../controller/paymentController");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    app.post("/api/auth/payment", [verifyToken], paymentController.openPaymentMethod);
    //app.get("/api/auth/billing/:year/:month", [verifyToken], paymentController.getBillingByMonthAndYear);
};
