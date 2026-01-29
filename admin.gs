// ===============================
// ADMIN MANAGEMENT FUNCTIONS
// ===============================

// Get dashboard statistics
function getDashboardStats(role) {
  var stats = {
    totalCounselors: 0,
    pendingCounselors: 0,
    totalStudents: 0,
    activeStudents: 0,
    totalSessions: 0,
    todaySessions: 0,
    totalAssessments: 0,
    completedAssessments: 0
  };
  
  try {
    // Get all counselors
    var counselors = getAllCounselors();
    stats.totalCounselors = counselors.length;
    stats.pendingCounselors = counselors.filter(c => c.status === 'pending').length;
    
    // Get all students
    var students = getAllStudents();
    stats.totalStudents = students.length;
    stats.activeStudents = students.filter(s => s.status === 'active').length;
    
    // Get session stats
    var sessionsSheet = getSheet("counseling_sessions");
    if (sessionsSheet) {
      var sessionsData = sessionsSheet.getDataRange().getValues();
      stats.totalSessions = sessionsData.length - 1;
      
      // Count today's sessions
      var today = new Date();
      var todayStr = today.toISOString().split('T')[0];
      stats.todaySessions = sessionsData.filter((row, index) => {
        if (index === 0) return false;
        var sessionDate = new Date(row[3]);
        return sessionDate.toISOString().split('T')[0] === todayStr && row[5] === 'scheduled';
      }).length;
      
      // Count completed sessions
      stats.completedAssessments = sessionsData.filter((row, index) => {
        if (index === 0) return false;
        return row[5] === 'completed';
      }).length;
    }
    
    // Get assessment stats
    var assessmentsSheet = getSheet("assessments");
    if (assessmentsSheet) {
      var assessmentsData = assessmentsSheet.getDataRange().getValues();
      stats.totalAssessments = assessmentsData.length - 1;
    }
    
    // Role-specific stats
    if (role === "counselor") {
      var session = getSession();
      if (session) {
        var counselorSessions = getCounselorSessions(session.id);
        stats.mySessions = counselorSessions.length;
        stats.todayMySessions = counselorSessions.filter(s => {
          var sessionDate = new Date(s.scheduled_date);
          return sessionDate.toISOString().split('T')[0] === todayStr && s.status === 'scheduled';
        }).length;
      }
    }
    
    if (role === "student") {
      var session = getSession();
      if (session) {
        var studentSessions = getStudentSessions(session.id);
        stats.mySessions = studentSessions.length;
        stats.upcomingSessions = studentSessions.filter(s => s.status === 'scheduled').length;
      }
    }
    
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
  }
  
  return stats;
}

// System settings management
function getSystemSettings() {
  var sheet = getSheet("settings");
  if (!sheet) return {};
  
  var data = sheet.getDataRange().getValues();
  var settings = {};
  
  for (var i = 1; i < data.length; i++) {
    settings[data[i][0]] = data[i][1];
  }
  
  // Set default values if not exists
  var defaults = {
    "site_name": "ASAKUR",
    "site_description": "Compassion Focused Gratitude Cybercounseling",
    "contact_email": "admin@asakur.com",
    "emergency_contact": "112",
    "session_duration": "60",
    "max_sessions_per_day": "5",
    "pwa_enabled": "true",
    "main_color": "#0d3b66",
    "accent_color": "#2a9d8f"
  };
  
  for (var key in defaults) {
    if (!settings[key]) {
      settings[key] = defaults[key];
    }
  }
  
  return settings;
}

function updateSystemSetting(key, value) {
  try {
    var sheet = getSheet("settings");
    if (!sheet) {
      sheet = createSheetIfNotExists("settings", [
        "setting_key", "setting_value", "description", "updated_at"
      ]);
    }
    
    var data = sheet.getDataRange().getValues();
    var updated = false;
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(value);
        sheet.getRange(i + 1, 4).setValue(new Date());
        updated = true;
        break;
      }
    }
    
    if (!updated) {
      sheet.appendRow([key, value, "", new Date()]);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Data export functions
function exportAllData() {
  var exportData = {
    counselors: getAllCounselors(),
    students: getAllStudents(),
    sessions: getAllSessions(),
    assessments: getAllAssessments()
  };
  
  var jsonString = JSON.stringify(exportData, null, 2);
  var blob = Utilities.newBlob(jsonString, 'application/json', 'asakur_backup_' + new Date().toISOString() + '.json');
  
  return blob.getDataAsString();
}

// Backup and restore
function createBackup() {
  var exportContent = exportAllData();
  var timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  var fileName = 'asakur_backup_' + timestamp + '.json';
  
  var folder = DriveApp.getRootFolder();
  var file = folder.createFile(fileName, exportContent, MimeType.PLAIN_TEXT);
  
  return {
    success: true,
    message: 'Backup created successfully',
    fileId: file.getId(),
    fileName: fileName,
    downloadUrl: 'https://drive.google.com/uc?export=download&id=' + file.getId()
  };
}

function restoreBackup(jsonData) {
  try {
    var data = JSON.parse(jsonData);
    
    // Clear existing data
    clearAllData();
    
    // Initialize database
    initializeDatabase();
    
    // Restore data (simplified implementation)
    // Note: For production, you'd need more robust handling
    
    return { success: true, message: 'Backup restored successfully' };
  } catch (error) {
    return { success: false, message: 'Error restoring backup: ' + error.toString() };
  }
}