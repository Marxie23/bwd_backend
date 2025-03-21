const { Notification, NotificationRecipient } = require('../model/notificationsModel');
const User = require('../model/userModel');
const Customer = require('../model/customerModel');
const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'bongaowaterdistrictmarxie@gmail.com',
      pass: 'uhfy ajkh nvjs bczy',
    },
  });
  
  // Utility function to send email
  const sendEmail = async (to, subject, text) => {
    const mailOptions = {
      from: 'bongaowaterdistrictmarxie@gmail.com',
      to,
      subject,
      text,
    };
  
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.response);
      return true

    } catch (error) {
      console.error('Error sending email:', error.message);
      return false
    }
  };
// Create a new notification and send it to selected users/customers
exports.createNotification = async (req, res) => {
  try {
    const { type, content,contentId, recipients, visibleTo } = req.body;

    if (!recipients || recipients.length === 0) {
      return res.status(400).json({ message: 'At least one recipient is required', status:false,notification:[]});
    }

    // Create the notification
    const notification = await Notification.create({
      type,
      content,
      contentId,
      visibleTo,
    });

    const recipientEntries = recipients.map(async (recipient) => {
      const email = recipient.email || recipient.customerEmail;
      if (email) {
          await sendEmail(email, `New Notification: ${type}`, `${content}\n\nThank you.\nBongao Water District`);
      }
      return {
          notificationId: notification.id,
          userId: recipient.id || null,
          customerId: recipient.customerId || null,
      };
  });

  await NotificationRecipient.bulkCreate(await Promise.all(recipientEntries));

    res.status(201).json({ message: 'Notification sent successfully', status: true, notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Internal server error', status: false,notification:[] });
  }
};

// Get notifications for a specific user (userId or customerId)
exports.getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(userId)

    if (!userId) {
      return res.status(400).json({ message: 'User ID or Customer ID is required', status: false,notifications:[] });
    }

    const notifications = await NotificationRecipient.findAll({
      where: { userId: userId },
      attributes: ['isRead'],
      include: [{
        model: Notification,
        as: "Notifications", // ✅ Must match the alias in the association
      }],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      message:"succesfull",
      status: true,
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Internal server error', status:false,notifications:[] });
  }
};

// Get notifications for admin or cashier
exports.getAdminOrCashierNotifications = async (req, res) => {
  try {
    const { role } = req.params; // "Admin" or "Cashier"

    if (!['Admin', 'Cashier'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const notifications = await Notification.findAll({
      where: { visibleTo: ['All', role] },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching admin/cashier notifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Mark a notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId, userId, customerId } = req.body;

    if (!notificationId || (!userId && !customerId)) {
      return res.status(400).json({ message: 'Notification ID and User/Customer ID required' });
    }

    const recipient = await NotificationRecipient.findOne({
      where: { notificationId, userId, customerId },
    });

    if (!recipient) {
      return res.status(404).json({ message: 'Notification not found for this user/customer' });
    }

    await recipient.update({ isRead: true });

    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Remove (soft delete) a notification
exports.removeNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.update({ isRemoved: true });

    res.status(200).json({ message: 'Notification removed' });
  } catch (error) {
    console.error('Error removing notification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
