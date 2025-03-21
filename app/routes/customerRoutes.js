const verifyToken = require("../middleware/authJWT");
const customerController = require("../controller/customerController");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    // Routes for customers
    //app.post("/api/auth/customer/add", [verifyToken], customerController.create);
    app.post("/api/auth/customer/add", customerController.create);
    app.get("/api/auth/customer", [verifyToken], customerController.getAll);
    app.get("/api/auth/customer/:id", [verifyToken], customerController.getById);
    app.put("/api/auth/customer/:id", [verifyToken], customerController.update);
    app.delete("/api/auth/customer/:id", [verifyToken], customerController.delete);
};
