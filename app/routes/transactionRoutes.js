const verifyToken = require("../middleware/authJWT");
const tansactionController = require("../controller/transactionController");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    app.post("/api/auth/transaction/add", [verifyToken], tansactionController.create);
    app.get("/api/auth/transaction", [verifyToken], tansactionController.getAll);
    app.get("/api/auth/transaction/:userId", [verifyToken], tansactionController.getUserTransaction);
};
