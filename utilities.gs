// ===============================
// UTILITY & HELPER FUNCTIONS
// ===============================

// Update user status (helper function)
function updateUserStatus(userId, newStatus) {
  var sheet = getSheet("users");
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(userId)) {
      sheet.getRange(i + 1, 6).setValue(newStatus);
      break;
    }
  }
}

// Log risk level change
function logRiskLevelChange(userId, newRiskLevel, studentName) {
  try {
    var logSheet = getSheet("risk_level_logs");
    if (!logSheet) {
      // Coba buat sheet log jika belum ada
      var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      logSheet = spreadsheet.insertSheet("risk_level_logs");
      
      // Buat header
      var headers = ["timestamp", "user_id", "student_name", "new_risk_level", "changed_by", "notes"];
      logSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format header
      var headerRange = logSheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#0d3b66");
      headerRange.setFontColor("white");
      headerRange.setFontWeight("bold");
    }
    
    // Ambil session untuk mengetahui siapa yang mengubah
    var session = getSession();
    var changedBy = session ? (session.fullname || session.username || "System") : "System";
    
    // Tambah log
    var newRow = [
      new Date(),
      userId,
      studentName,
      newRiskLevel,
      changedBy,
      "Diubah melalui Manajemen Mahasiswa"
    ];
    
    var lastRow = logSheet.getLastRow();
    logSheet.getRange(lastRow + 1, 1, 1, newRow.length).setValues([newRow]);
    
    console.log("📝 Risk level change logged:", { userId, newRiskLevel });
    
  } catch (error) {
    console.error("⚠️ Failed to log risk level change:", error);
  }
}

// Get user by ID
function getUserById(userId) {
  var sheet = getSheet("users");
  if (!sheet) return null;
  
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(userId)) {
      return {
        id: data[i][0],
        username: data[i][1],
        email: data[i][2],
        role: data[i][4],
        status: data[i][5],
        fullname: data[i][6]
      };
    }
  }
  return null;
}

// Log activity
function logActivity(action, details) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName('LogAktivitas');
    
    if (!logSheet) {
      // Create log sheet if it doesn't exist
      logSheet = ss.insertSheet('LogAktivitas');
      logSheet.getRange('A1:D1').setValues([['Timestamp', 'Action', 'Details', 'User']]);
    }
    
    const timestamp = new Date();
    const user = Session.getActiveUser().getEmail();
    
    logSheet.appendRow([timestamp, action, details, user]);
    
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

// Email functions
function sendEmailNotification(recipient, subject, body) {
  try {
    MailApp.sendEmail({
      to: recipient,
      subject: subject,
      body: body,
      name: "ASAKUR System"
    });
    return { success: true };
  } catch (error) {
    console.error("Email error:", error);
    return { success: false, message: error.toString() };
  }
}

// Test functions
function testLogin() {
  var testCases = [
    {username: "keymaster_asakur", password: "Admin@123", expected: "admin"},
    {username: "konselor01", password: "Konselor@123", expected: "counselor"},
    {username: "mahasiswa01", password: "Mahasiswa@123", expected: "student"}
  ];
  
  var results = [];
  
  testCases.forEach(function(testCase) {
    console.log("\nTesting:", testCase.username);
    var result = login(testCase.username, testCase.password);
    results.push({
      username: testCase.username,
      success: result.success,
      expectedRole: testCase.expected,
      actualRole: result.user ? result.user.role : "none",
      message: result.message
    });
  });
  
  console.log("\n=== TEST RESULTS ===");
  console.log(JSON.stringify(results, null, 2));
  
  return results;
}

// Debug functions
function debugUserSheet() {
  try {
    var sheet = getSheet("users");
    if (!sheet) {
      return { error: "Sheet 'users' tidak ditemukan" };
    }
    
    var data = sheet.getDataRange().getValues();
    
    var result = {
      totalRows: data.length,
      headers: data[0],
      users: []
    };
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      result.users.push({
        rowNumber: i + 1,
        id: row[0],
        username: row[1],
        email: row[2],
        passwordLength: row[3] ? String(row[3]).length : 0,
        role: row[4],
        status: row[5],
        fullname: row[6]
      });
    }
    
    return result;
  } catch (error) {
    return { error: error.toString() };
  }
}

function testSpecificUser(username) {
  try {
    var sheet = getSheet("users");
    if (!sheet) {
      return { error: "Sheet tidak ditemukan" };
    }
    
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var dbUsername = row[1] ? String(row[1]).trim() : "";
      var dbEmail = row[2] ? String(row[2]).trim() : "";
      
      if (dbUsername.toLowerCase() === username.toLowerCase() || 
          dbEmail.toLowerCase() === username.toLowerCase()) {
        return {
          found: true,
          rowNumber: i + 1,
          data: {
            id: row[0],
            username: row[1],
            email: row[2],
            password: "***" + String(row[3]).slice(-3),
            passwordLength: row[3] ? String(row[3]).length : 0,
            role: row[4],
            status: row[5],
            fullname: row[6],
            created_at: row[7]
          }
        };
      }
    }
    
    return { found: false, message: "User tidak ditemukan" };
  } catch (error) {
    return { error: error.toString() };
  }
}

// Database fixing functions
function fixUserDataFormat() {
  try {
    var sheet = getSheet("users");
    if (!sheet) {
      return { success: false, message: "Sheet tidak ditemukan" };
    }
    
    var data = sheet.getDataRange().getValues();
    var fixed = 0;
    
    for (var i = 1; i < data.length; i++) {
      var needsUpdate = false;
      
      // Trim whitespace dari semua kolom text
      for (var j = 0; j < data[i].length; j++) {
        if (typeof data[i][j] === 'string') {
          var trimmed = data[i][j].trim();
          if (trimmed !== data[i][j]) {
            sheet.getRange(i + 1, j + 1).setValue(trimmed);
            needsUpdate = true;
          }
        }
      }
      
      // Pastikan role dan status lowercase
      if (data[i][4]) {
        var role = String(data[i][4]).trim().toLowerCase();
        if (role !== data[i][4]) {
          sheet.getRange(i + 1, 5).setValue(role);
          needsUpdate = true;
        }
      }
      
      if (data[i][5]) {
        var status = String(data[i][5]).trim().toLowerCase();
        if (status !== data[i][5]) {
          sheet.getRange(i + 1, 6).setValue(status);
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        fixed++;
      }
    }
    
    return { 
      success: true, 
      message: "Diperbaiki " + fixed + " baris data" 
    };
  } catch (error) {
    return { 
      success: false, 
      message: error.toString() 
    };
  }
}

// Test connection functions
function testConnection() {
  Logger.log("=== testConnection called ===");
  
  try {
    // Coba akses spreadsheet sederhana
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    
    return JSON.stringify({
      success: true,
      message: "Connection successful",
      timestamp: new Date().toISOString(),
      spreadsheet: ss.getName(),
      sheetCount: sheets.length,
      sheets: sheets.map(s => s.getName())
    });
    
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error.toString(),
      message: "Connection failed"
    });
  }
}

function checkPermissions() {
  Logger.log("=== checkPermissions ===");
  
  try {
    // Coba berbagai operasi untuk test permission
    var hasSpreadsheetAccess = false;
    var hasDriveAccess = false;
    
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheetNames = ss.getSheets().map(s => s.getName());
      hasSpreadsheetAccess = true;
    } catch (e) {
      hasSpreadsheetAccess = false;
    }
    
    try {
      var root = DriveApp.getRootFolder();
      hasDriveAccess = true;
    } catch (e) {
      hasDriveAccess = false;
    }
    
    return JSON.stringify({
      success: true,
      permissions: {
        spreadsheet: hasSpreadsheetAccess,
        drive: hasDriveAccess,
        user: Session.getActiveUser().getEmail(),
        effectiveUser: Session.getEffectiveUser().getEmail()
      },
      environment: {
        scriptId: ScriptApp.getScriptId(),
        timezone: Session.getScriptTimeZone()
      }
    });
    
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error.toString()
    });
  }
}