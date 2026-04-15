const Notification = require('../models/notification.model');

const listMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy thông báo', error: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await Notification.updateMany(
      { recipient: userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );
    res.json({ message: 'Đã đánh dấu tất cả là đã đọc' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật thông báo', error: error.message });
  }
};

const markOneAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { $set: { read: true, readAt: new Date() } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }

    res.json({ notification, message: 'Đã đánh dấu đã đọc' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật thông báo', error: error.message });
  }
};

const clearMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    await Notification.deleteMany({ recipient: userId });
    res.json({ message: 'Đã xóa toàn bộ thông báo' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa thông báo', error: error.message });
  }
};

module.exports = {
  listMyNotifications,
  markAllAsRead,
  markOneAsRead,
  clearMyNotifications,
};
