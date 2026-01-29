// ===============================
// NOTIFICATIONS MANAGEMENT FUNCTIONS
// ===============================

// Create system notification
function createSystemNotification(userId, title, message, type) {
  try {
    var sheet = getSheet("notifications");
    if (!sheet) {
      sheet = createSheetIfNotExists("notifications", [
        "notification_id", "user_id", "title", "message", 
        "type", "is_read", "created_at"
      ]);
    }
    
    var notificationId = getNextId("notifications");
    
    sheet.appendRow([
      notificationId,
      userId,
      title,
      message,
      type || "info",
      false,
      new Date()
    ]);
    
    return { success: true, notificationId: notificationId };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Get my notifications
function getMyNotifications() {
  try {
    var session = getSession();
    if (!session) return [];
    
    var sheet = getSheet("notifications");
    if (!sheet) return [];
    
    var data = sheet.getDataRange().getValues();
    var notifications = [];
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]) === String(session.id) && data[i][5] === false) {
        notifications.push({
          id: data[i][0],
          title: data[i][2],
          message: data[i][3],
          type: data[i][4],
          created_at: data[i][6]
        });
      }
    }
    
    return notifications;
  } catch (error) {
    console.error("Error getting notifications:", error);
    return [];
  }
}

// Mark notification as read
function markNotificationAsRead(notificationId) {
  try {
    var sheet = getSheet("notifications");
    if (!sheet) return { success: false };
    
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(notificationId)) {
        sheet.getRange(i + 1, 6).setValue(true);
        return { success: true };
      }
    }
    
    return { success: false };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Mark all notifications as read
function markAllNotificationsAsRead() {
  try {
    var session = getSession();
    if (!session) return { success: false };
    
    var sheet = getSheet("notifications");
    if (!sheet) return { success: false };
    
    var data = sheet.getDataRange().getValues();
    var updated = false;
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]) === String(session.id) && data[i][5] === false) {
        sheet.getRange(i + 1, 6).setValue(true);
        updated = true;
      }
    }
    
    return { success: updated };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}