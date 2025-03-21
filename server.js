// Import required modules
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const cors = require("cors");
const helmet = require("helmet");
const sql = require('mssql');
const cookieParser = require('cookie-parser');
const sql_config = require('./app/config/config');
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Initialize app and server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://127.0.0.1:3000", "http://192.168.254.168:3000", "http://localhost:3000",
            "https://127.0.0.1:3000", "https://192.168.254.168:3000", "https://localhost:3000"
        ],
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// Middleware setup
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

const corsOptions = {
    origin: ["http://127.0.0.1:3000", "http://192.168.254.168:3000", "http://localhost:3000",
        "https://127.0.0.1:3000", "https://192.168.254.168:3000", "https://localhost:3000"
    ], // List of allowed origins
    credentials: true, // Allow credentials (cookies) to be sent
};
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(cors(corsOptions));

// Database configuration
const config = {
    user: sql_config.USER,
    password: sql_config.PASSWORD,
    server: sql_config.SERVER,
    database: sql_config.DATABASE,
    pool: {
        max: 10,
        min: 0,
    },
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};

// Routes setup
require("./app/routes/userRoutes")(app);
require("./app/routes/customerRoutes")(app);
require("./app/routes/meterRoutes")(app);
require("./app/routes/meterreadingRoutes")(app);
require("./app/routes/billingRoutes")(app);
require("./app/routes/notificationRoutes")(app);
require("./app/routes/paymentRoutes")(app);
require("./app/routes/notificationsRoutes")(app);
require("./app/routes/transactionRoutes")(app);

// Real-time notifications with Socket.IO
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    socket.on('disconnect', (data) => {
        console.log('User disconnected:', socket.id);
    });

    socket.on("join_user",(data)=>{
        socket.join(data)
    });
    socket.on("new_billing",(data) =>{
        socket.to(data.receiverID).emit("receive_notification",data)
    })

    // socket.on("new_billing",(data) =>{
    //     console.log(data)
    //     socket.broadcast.emit("receive_notification",data)
    // })
});

// Broadcast notification function
app.broadcastNotification = (notification) => {
    io.emit('new-notification', notification);
};

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Connect to SQL Server
sql.connect(config)
    .then(pool => {
        console.log('Connected to SQL Server');
    })
    .catch(err => {
        console.error('Connection failed ', err);
    });

module.exports = io; // Export Socket.IO instance
