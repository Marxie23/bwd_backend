const verifyToken = require("../middleware/authJWT");
const notificationController = require("../controller/notificationController");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    app.post('/api/auth/notifications',[verifyToken], notificationController.createNotification);
    app.get('/api/auth/notifications',[verifyToken], notificationController.getAllNotifications);
    //app.get('/api/auth/notifications/:id',[verifyToken], notificationController.getCustomerNotifications);
    app.put('/api/auth/notifications/:id',[verifyToken], notificationController.updateNotification);
    app.delete('/api/auth/notifications/:id',[verifyToken], notificationController.deleteNotification);
    app.get('/api/auth/notifications/:customerId',[verifyToken],notificationController.getNotificationsByCustomerId)
};
