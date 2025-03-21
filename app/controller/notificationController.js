const io = require('../../server')
const Notification = require('../model/notificationModel');
const Customer = require("../model/customerModel")
const User = require('../model/userModel');
const { Op } = require('sequelize'); // Sequelize operators for querying

// Create a new notification
exports.createNotification = async (req, res) => {
  try {
    const { type, content, contentId, to, isRead, isRemoved, customerId } = req.body;

    const user = await User.findOne({where:{
      CustomerId: customerId
    }})
    const userId = user.UserID

    const notification = await Notification.create({
      type,
      content,
      contentId,
      to,
      isRead: isRead || false,
      isRemoved: isRemoved || false,
      customerId: customerId || null,
      userId: userId || null,
    });
    res.status(201).json({
      message: 'Notification created successfully',
      notification,
    });
  } catch (error) {
    console.error('Error creating notification:', error.message);
    res.status(500).json({
      message: 'Error creating notification',
      error: error.message,
      notification:[]
    });
  }
};

// Get all notifications
exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      include: [
        { model: Customer, as: 'Customer', attributes: ['CustomerID', 'Firstname', 'Lastname'] },
        { model: User, as: 'User', attributes: ['userID', 'username'] },
      ],
    });

    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error retrieving notifications:', error.message);
    res.status(500).json({
      message: 'Error retrieving notifications',
      error: error.message,
    });
  }
};

exports.getCustomerNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      include: [
        { model: Customer, as: 'Customer', attributes: ['CustomerID', 'Firstname', 'Lastname'] },
        { model: User, as: 'User', attributes: ['userID', 'username'] },
      ],
    });

    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error retrieving notifications:', error.message);
    res.status(500).json({
      message: 'Error retrieving notifications',
      error: error.message,
    });
  }
};

// Get a single notification by ID
exports.getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByPk(id, {
      include: [
        { model: Customer, as: 'Customer', attributes: ['CustomerID', 'Firstname', 'Lastname'] },
        { model: User, as: 'User', attributes: ['userID', 'username'] },
      ],
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json(notification);
  } catch (error) {
    console.error('Error retrieving notification:', error.message);
    res.status(500).json({
      message: 'Error retrieving notification',
      error: error.message,
    });
  }
};

// Update a notification
exports.updateNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByPk(id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.update({
      isRead: true
    });

    res.status(200).json({
      message: 'Notification updated successfully',
      notification,
      status: true
    });
  } catch (error) {
    console.error('Error updating notification:', error.message);
    res.status(500).json({
      message: error.message,
      notification: [],
      status: false
    });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByPk(id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.update({
      isRemoved: true
    });

    res.status(200).json({
      message: 'Notification deleted successfully',
      status: true
    });
  } catch (error) {
    console.error('Error deleting notification:', error.message);
    res.status(500).json({
      message: 'Error deleting notification',
      error: error.message,
      status: false
    });
  }
};

exports.getNotificationsByCustomerId = async (req, res) => {
  const customerId = req.params.customerId;

  if (!customerId) {
    return res.status(400).json({
      message: "Customer ID is required."
    });
  }

  try {
    // Fetch notifications related to the customerId
    const notifications = await Notification.findAll({
      where: {
        customerId: customerId,
        isRemoved: false,
      },
      include: [
        {
          model: Customer, // Include customer details (if needed)
          as: 'Customer',
          attributes: ['CustomerID', 'Firstname', 'Lastname']
        },
        {
          model: User, // Include user details (if needed)
          as: 'User',
          attributes: ['userID', 'username'], // You can adjust attributes as needed
        },
      ],
      order: [['createdAt', 'DESC']], // Order by most recent notification
    });

    const formattedNotifications = notifications.map(notification => {
      const user = notification.User
      const customer = notification.Customer
      return{
        customer_ID : customer.CustomerID,
        customer_fullname : `${customer.Firstname} ${customer.Lastname}`,
        user_ID : user.userID,
        user_username: user.username,
        notification_ID: notification.id,
        notification_content: notification.content,
        notification_contentID : notification.contentId,
        notification_time: notification.createdAt,
        notification_status: notification.isRead,
      }
    })

    // If no notifications found
    if (notifications.length === 0) {
      return res.status(404).json({
        status: true,
        message: `No notifications found for customer with ID: ${customerId}`,
        notifications:[]
      });
    }

    return res.status(200).json({
      status: true,
      message: `Notifications found for customer with ID: ${customerId}`,
      notifications: formattedNotifications
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "An error occurred while retrieving notifications.",
      notifications:[],
      error: error.message,
    });
  }
};