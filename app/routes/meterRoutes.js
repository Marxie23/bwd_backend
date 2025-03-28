const verifyToken = require("../middleware/authJWT");
const meterController = require("../controller/meterController");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    app.get("/api/auth/meter", [verifyToken], meterController.getAll);
};
