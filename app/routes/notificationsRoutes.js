const verifyToken = require("../middleware/authJWT");
const notificationController = require("../controller/notificationsController");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    // Routes for notifications
    app.post("/api/auth/notification/add", [verifyToken], notificationController.createNotification);
    app.get("/api/auth/notification/user/:userId", [verifyToken], notificationController.getUserNotifications);
    app.get("/api/auth/notification/customer/:customerId", [verifyToken], notificationController.getUserNotifications);
    app.get("/api/auth/notification/role/:role", [verifyToken], notificationController.getAdminOrCashierNotifications);
    app.put("/api/auth/notification/read", [verifyToken], notificationController.markNotificationAsRead);
    app.delete("/api/auth/notification/:notificationId", [verifyToken], notificationController.removeNotification);
};
