// ===============================
// DATABASE CONNECTION & OPERATIONS
// ===============================

// Database connection
function getDB() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet(name) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Try various name variations
    var possibleNames = [
      name,
      name.toLowerCase(),
      name.toUpperCase(),
      name.replace(/_/g, ' '),
      name.replace(/ /g, '_')
    ];
    
    // For students_profiles
    if (name.toLowerCase().includes('student')) {
      possibleNames = possibleNames.concat([
        'students_profiles', 'Students_Profiles', 'STUDENTS_PROFILES',
        'student_profiles', 'Student_Profiles',
        'mahasiswa', 'Mahasiswa', 'MAHASISWA',
        'data_mahasiswa', 'Data_Mahasiswa',
        'students', 'Students', 'STUDENTS',
        'Data Mahasiswa', 'data siswa'
      ]);
    }
    
    for (var i = 0; i < possibleNames.length; i++) {
      var sheet = spreadsheet.getSheetByName(possibleNames[i]);
      if (sheet) {
        console.log(`✅ Found sheet: ${possibleNames[i]}`);
        return sheet;
      }
    }
    
    // Log all available sheets for debugging
    console.log("Available sheets:");
    var sheets = spreadsheet.getSheets();
    sheets.forEach(function(s, index) {
      console.log(`  ${index + 1}. ${s.getName()}`);
    });
    
    return null;
    
  } catch (error) {
    console.error("Error in getSheet:", error);
    return null;
  }
}

function createSheetIfNotExists(sheetName, headers) {
  var ss = getDB();
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#0d3b66')
                 .setFontColor('white')
                 .setFontWeight('bold');
    }
  }
  return sheet;
}

function getNextId(sheetName) {
  var sheet = getSheet(sheetName);
  if (!sheet) return 1;
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return 1;
  
  var lastId = data[data.length - 1][0];
  return parseInt(lastId) + 1;
}

// Database initialization
function initializeDatabase() {
  try {
    // Users sheet
    createSheetIfNotExists("users", [
      "id", "username", "email", "password", "role", 
      "status", "fullname", "created_at"
    ]);
    
    // Students profiles
    createSheetIfNotExists("students_profiles", [
      "user_id", "fullname", "nim", "email", "phone", 
      "emergency_contact", "status", "registered_date",
      "faculty", "program", "year", "notes"
    ]);
    
    // Counselors profiles
    createSheetIfNotExists("counselors_profiles", [
      "user_id", "fullname", "email", "phone", "specialization",
      "bio", "status", "availability", "created_at",
      "experience", "education", "certifications"
    ]);
    
    // Counseling sessions
    createSheetIfNotExists("counseling_sessions", [
      "session_id", "student_id", "counselor_id", "scheduled_date",
      "session_type", "status", "meeting_link", "notes", "created_at"
    ]);
    
    // Assessments
    createSheetIfNotExists("assessments", [
      "assessment_id", "student_id", "counselor_id", "session_id",
      "gratitude_score", "compassion_score", "suicidal_score",
      "total_score", "notes", "assessment_date", "created_at"
    ]);
    
    // Emergency logs
    createSheetIfNotExists("emergency_logs", [
      "log_id", "user_id", "username", "emergency_contact",
      "timestamp", "status", "handled_by", "notes"
    ]);
    
    // Notifications
    createSheetIfNotExists("notifications", [
      "notification_id", "user_id", "title", "message", 
      "type", "is_read", "created_at"
    ]);
    
    // System settings
    createSheetIfNotExists("settings", [
      "setting_key", "setting_value", "description", "updated_at"
    ]);
    
    // Counseling requests
    createSheetIfNotExists("counseling_requests", [
      "request_id", "student_id", "counselor_id", "preferred_date",
      "preferred_time", "session_type", "reason", "status", "created_at"
    ]);
    
    // Initialize default admin user
    initializeDefaultAdmin();
    
    // Initialize default settings
    initializeDefaultSettings();
    
    return { success: true, message: "Database initialized successfully" };
  } catch (error) {
    return { success: false, message: "Error initializing database: " + error.toString() };
  }
}

function initializeDefaultAdmin() {
  var usersSheet = getSheet("users");
  var data = usersSheet.getDataRange().getValues();
  
  // Check if admin already exists
  var adminExists = false;
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === "admin") {
      adminExists = true;
      break;
    }
  }
  
  if (!adminExists) {
    usersSheet.appendRow([
      1,
      "admin",
      "admin@asakur.com",
      "Admin123",
      "admin",
      "active",
      "Administrator",
      new Date()
    ]);
  }
}

function initializeDefaultSettings() {
  var settingsSheet = getSheet("settings");
  var data = settingsSheet.getDataRange().getValues();
  
  var defaultSettings = [
    ["site_name", "ASAKUR", "Nama aplikasi"],
    ["site_description", "Compassion Focused Gratitude Cybercounseling", "Deskripsi aplikasi"],
    ["contact_email", "admin@asakur.com", "Email kontak admin"],
    ["emergency_contact", "112", "Kontak darurat default"],
    ["session_duration", "60", "Durasi sesi (menit)"],
    ["max_sessions_per_day", "5", "Maksimal sesi per hari per konselor"],
    ["pwa_enabled", "true", "Aktifkan PWA"],
    ["main_color", "#0d3b66", "Warna utama"],
    ["accent_color", "#2a9d8f", "Warna aksen"]
  ];
  
  for (var i = 0; i < defaultSettings.length; i++) {
    var setting = defaultSettings[i];
    var exists = false;
    
    for (var j = 1; j < data.length; j++) {
      if (data[j][0] === setting[0]) {
        exists = true;
        break;
      }
    }
    
    if (!exists) {
      settingsSheet.appendRow([setting[0], setting[1], setting[2], new Date()]);
    }
  }
}

// Database testing and maintenance
function testDatabase() {
  try {
    var sheets = [
      "users",
      "students_profiles", 
      "counselors_profiles",
      "counseling_sessions",
      "assessments",
      "notifications",
      "settings"
    ];
    
    var results = [];
    
    sheets.forEach(function(sheetName) {
      var sheet = getSheet(sheetName);
      results.push({
        name: sheetName,
        exists: !!sheet,
        rowCount: sheet ? sheet.getLastRow() : 0
      });
    });
    
    return results;
  } catch (error) {
    return { error: error.toString() };
  }
}

function clearAllData() {
  // WARNING: This function clears all data for testing purposes
  var sheets = [
    "users",
    "students_profiles", 
    "counselors_profiles",
    "counseling_sessions",
    "assessments",
    "emergency_logs",
    "notifications",
    "settings",
    "counseling_requests"
  ];
  
  sheets.forEach(function(sheetName) {
    var sheet = getSheet(sheetName);
    if (sheet) {
      sheet.clear();
    }
  });
  
  return { success: true, message: "All data cleared. Run initializeDatabase() to restore." };
}