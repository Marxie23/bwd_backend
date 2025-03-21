const verifyToken = require("../middleware/authJWT");
const meterReadingController = require("../controller/meterreadingController");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    app.post("/api/auth/meterReading/add", [verifyToken], meterReadingController.create);
    app.put("/api/auth/meterReading/:id",[verifyToken], meterReadingController.updateMeterReadings);
    app.get("/api/auth/meterReading", [verifyToken], meterReadingController.getAll);
    // app.get("/api/auth/meterReading/:year/:month/:meterId", [verifyToken], meterReadingController.getMeterReadingsByMonthYearAndMeterId);
    app.get("/api/auth/meterReading/:year/:month/:meterId", [verifyToken], meterReadingController.getMeterReadingAndBillingByMonthYearAndMeterID);
    // app.get("/api/auth/meterReading/:year/:month", [verifyToken], meterReadingController.getMeterReadingsByMonthYear);
    app.get("/api/auth/meterReading/:year/:month", [verifyToken], meterReadingController.getMeterReadingAndBillingByMonthYear);
};
