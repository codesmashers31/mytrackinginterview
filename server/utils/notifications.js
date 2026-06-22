import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Create a notification for a specific user ID
 */
export const createNotification = async (recipientId, title, message, type = 'info') => {
  try {
    const notification = new Notification({
      recipientId,
      title,
      message,
      type
    });
    await notification.save();
    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};

/**
 * Send a notification to a user identified by their email address
 */
export const createNotificationByEmail = async (email, title, message, type = 'info') => {
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return await createNotification(user._id, title, message, type);
    }
  } catch (err) {
    console.error('Failed to create notification by email:', err.message);
  }
};

/**
 * Send a notification to all Admin users
 */
export const notifyAdmins = async (title, message, type = 'info') => {
  try {
    const admins = await User.find({ role: 'admin' });
    const promises = admins.map(admin => createNotification(admin._id, title, message, type));
    await Promise.all(promises);
  } catch (err) {
    console.error('Failed to notify admins:', err.message);
  }
};
