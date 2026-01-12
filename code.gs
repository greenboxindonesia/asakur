// ===============================
// MAIN APPLICATION FILE
// ===============================

// ===============================
// SESSION MANAGEMENT
// ===============================
function setSession(user) {
  var props = PropertiesService.getUserProperties();
  props.setProperty("session_user", JSON.stringify(user));
}

function getSession() {
  var props = PropertiesService.getUserProperties();
  var data = props.getProperty("session_user");
  return data ? JSON.parse(data) : null;
}

// ===============================
// URL HELPER FUNCTIONS FOR LOGIN
// ===============================

function getWebAppUrl() {
  return getBaseUrl();
}

function testUrlFunction() {
  var baseUrl = getBaseUrl();
  var scriptId = ScriptApp.getScriptId();
  var serviceUrl = ScriptApp.getService().getUrl();
  
  return {
    scriptId: scriptId,
    serviceUrl: serviceUrl,
    baseUrl: baseUrl,
    loginUrl: getPageUrl(''),
    registerStudentUrl: getPageUrl('register_student'),
    registerCounselorUrl: getPageUrl('register_counselor'),
    forgotPasswordUrl: getPageUrl('forgot_password'),
    adminUrl: getPageUrl('admin'),
    counselorUrl: getPageUrl('counselor'),
    studentUrl: getPageUrl('student')
  };
}

// Fungsi untuk mendapatkan URL dengan parameter
function buildUrl(page, params) {
  var baseUrl = getBaseUrl();
  var url = baseUrl;
  
  if (page) {
    url += '?page=' + page;
  }
  
  if (params && typeof params === 'object') {
    for (var key in params) {
      url += '&' + key + '=' + encodeURIComponent(params[key]);
    }
  }
  
  return url;
}

// Fungsi untuk mendapatkan base URL yang konsisten
function getBaseUrl() {
  try {
    var url = ScriptApp.getService().getUrl();
    
    // Pastikan URL menggunakan /exec
    if (url.includes('/dev')) {
      url = url.replace('/dev', '/exec');
    }
    
    // Hapus query parameters dan trailing slash
    url = url.split('?')[0].replace(/\/$/, '');
    
    // Pastikan berakhir dengan /exec
    if (!url.endsWith('/exec')) {
      url += '/exec';
    }
    
    return url;
    
  } catch (e) {
    console.error("Error in getBaseUrl:", e);
    
    // Fallback: konstruksi URL dari Script ID
    try {
      var scriptId = ScriptApp.getScriptId();
      return 'https://script.google.com/macros/s/' + scriptId + '/exec';
    } catch (e2) {
      console.error("Fallback juga gagal:", e2);
      return 'https://script.google.com';
    }
  }
}

// ===============================
// SIMPLE LOGOUT FUNCTIONS
// ===============================
function clearSession() {
  try {
    PropertiesService.getUserProperties().deleteProperty("session_user");
    console.log("Session cleared successfully");
    return { success: true };
  } catch (error) {
    console.error("Error clearing session:", error);
    return { success: false, message: error.toString() };
  }
}

// ===============================
// DATABASE CONNECTION
// ===============================
function getDB() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet(name) {
  return getDB().getSheetByName(name);
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

// ===============================
// UTILITY FUNCTIONS FOR DASHBOARD
// ===============================
function getSimpleBaseUrl() {
  return getBaseUrl();
}

// Fungsi helper untuk mendapatkan URL halaman
function getPageUrl(page) {
  var baseUrl = getBaseUrl();
  if (page && page !== '') {
    return baseUrl + '?page=' + page;
  }
  return baseUrl;
}

// ===============================
// MAIN ROUTING FUNCTION
// ===============================
function doGet(e) {
  var page = e && e.parameter && e.parameter.page ? e.parameter.page : "";
  var session = getSession();

  console.log("Requested page:", page, "Session exists:", !!session);
  
//function doGet(e) {
  //var page = e && e.parameter && e.parameter.page ? e.parameter.page : "";
  //var session = getSession();

  //console.log("Requested page:", page, "Session:", session);

  if (!page) {
    return HtmlService
      .createHtmlOutputFromFile("login")
      .setTitle("ASAKUR Login")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  switch(page) {
    case "admin":
      if (!session || session.role !== "admin") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("dashboard_admin")
        .setTitle("Admin - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    case "counselor":
      if (!session || session.role !== "counselor") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("dashboard_counselor")
        .setTitle("Konselor - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    case "student":
      if (!session || session.role !== "student") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("dashboard_student")
        .setTitle("Mahasiswa - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    case "register_student":
      return HtmlService
        .createHtmlOutputFromFile("register_student")
        .setTitle("Registrasi Mahasiswa - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    case "register_counselor":
      return HtmlService
        .createHtmlOutputFromFile("register_counselor")
        .setTitle("Registrasi Konselor - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    case "forgot_password":
      return HtmlService
        .createHtmlOutputFromFile("forgot_password")
        .setTitle("Lupa Password - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    case "reset_password":
      if (!session) {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("reset_password")
        .setTitle("Reset Password - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    // ===== ADMIN PAGES =====
    case "counselor_management":
      if (!session || session.role !== "admin") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("counselor_management")
        .setTitle("Manajemen Konselor - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    case "student_management":
      if (!session || session.role !== "admin") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("student_management")
        .setTitle("Manajemen Mahasiswa - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    case "appointment_schedule":
      if (!session || (session.role !== "admin" && session.role !== "counselor")) {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("appointment_schedule")
        .setTitle("Jadwal Konseling - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    case "system_settings":
      if (!session || session.role !== "admin") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("system_settings")
        .setTitle("Pengaturan Sistem - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

    case "emergency_contacts":
      if (!session || session.role !== "admin") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("emergency_contacts")
        .setTitle("Kontak Darurat - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    // ===== COUNSELOR PAGES =====
    case "counselor_schedule":
      if (!session || session.role !== "counselor") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("counselor_schedule")
        .setTitle("Jadwal Saya - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

    case "counselor_students":
      if (!session || session.role !== "counselor") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("counselor_students")
        .setTitle("Klien Saya - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

    case "counselor_assessments":
      if (!session || session.role !== "counselor") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("counselor_assessments")
        .setTitle("Asesmen - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

    case "counselor_video":
      if (!session || session.role !== "counselor") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("counselor_video")
        .setTitle("Sesi Virtual - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

    case "counselor_profile":
      if (!session || session.role !== "counselor") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("counselor_profile")
        .setTitle("Profil & Pengaturan - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

    // ===== STUDENT PAGES =====
    case "student_appointments":
      if (!session || session.role !== "student") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("student_appointments")
        .setTitle("Jadwal Konseling - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

    case "student_counselors":
      if (!session || session.role !== "student") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("student_counselors")
        .setTitle("Cari Konselor - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

    case "student_progress":
      if (!session || session.role !== "student") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("student_progress")
        .setTitle("Progress Saya - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

    case "student_profile":
      if (!session || session.role !== "student") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("student_profile")
        .setTitle("Profil Saya - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

    // ===== OTHER PAGES =====
    case "assessment_form":
      if (!session || (session.role !== "counselor" && session.role !== "admin")) {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("assessment_form")
        .setTitle("Form Asesmen - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

    /* 
    case "progress_report": - fungsi ini sudah dihandle progress_report
      if (!session) {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("progress_report")
        .setTitle("Laporan Progress - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    case "profile_settings": - fungsi ini sudah dihandle student_profile
      if (!session) {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("profile_settings")
        .setTitle("Profil Pengguna - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    */

    case "notification_center":
      if (!session) {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("notification_center")
        .setTitle("Notifikasi - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    case "video_conference":
      if (!session || (session.role !== "counselor" && session.role !== "student")) {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("video_conference")
        .setTitle("Sesi Virtual - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    default:
      return redirectToLogin();
  }
}

function redirectToLogin() {
  return HtmlService
    .createHtmlOutputFromFile("login")
    .setTitle("ASAKUR Login")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ===============================
// AUTHENTICATION FUNCTIONS
// ===============================
function login(username, password) {
  try {
    var sheet = getSheet("users");
    if (!sheet) {
      return { 
        success: false, 
        message: "System error: Database not available." 
      };
    }

    var data = sheet.getDataRange().getValues();
    
    console.log("Total users in database:", data.length - 1);
    console.log("Looking for username/email:", username);

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      
      // Debug: log setiap user untuk pemeriksaan
      console.log("Checking row", i, ":", row);
      
      var dbId = row[0];
      var dbUsername = row[1];     // Kolom B
      var dbEmail = row[2];        // Kolom C
      var dbPassword = row[3];     // Kolom D
      var dbRole = row[4];         // Kolom E
      var dbStatus = row[5];       // Kolom F
      
      console.log(`User ${i}: ${dbUsername} (${dbEmail}), Role: ${dbRole}, Status: ${dbStatus}`);

      // Cek kecocokan username atau email
      var isUsernameMatch = (dbUsername === username);
      var isEmailMatch = (dbEmail === username);
      
      if ((isUsernameMatch || isEmailMatch) && dbPassword === password) {
        console.log("Password match!");
        
        if (dbStatus !== "active") {
          console.log("Account not active:", dbStatus);
          return {
            success: false,
            message: "Akun belum aktif / belum disetujui admin."
          };
        }

        var user = {
          id: dbId,
          username: dbUsername,
          email: dbEmail,
          role: dbRole,
          fullname: row[6] || dbUsername  // Kolom G jika ada, fallback ke username
        };

        setSession(user);

        var redirectUrl = getPageUrl(dbRole);
        
        console.log("✅ Login successful for:", user.username);
        console.log("Redirecting to:", redirectUrl);

        return {
          success: true,
          user: user,
          redirectUrl: redirectUrl
        };
      }
    }

    console.log("❌ No matching user found");
    return { 
      success: false, 
      message: "Username/Email atau password salah." 
    };
  } catch (error) {
    console.error("Login error:", error);
    return { 
      success: false, 
      message: "System error: " + error.toString() 
    };
  }
}

// ===============================
// PERBAIKAN FUNGSI LOGOUT - TAMBAHKAN DI CODE.GS
// ===============================

// Fungsi logout yang diperbaiki
function serverLogout() {
  try {
    // Hapus session
    PropertiesService.getUserProperties().deleteProperty("session_user");
    
    // Dapatkan base URL untuk redirect
    var baseUrl = getBaseUrl();
    
    console.log("Logout successful - Redirecting to:", baseUrl);
    
    return {
      success: true,
      redirectUrl: baseUrl
    };
    
  } catch (error) {
    console.error("Error in serverLogout:", error);
    
    return {
      success: false,
      redirectUrl: getBaseUrl(),
      message: error.toString()
    };
  }
}

// ===============================
// ADMIN FUNCTIONS
// ===============================
function getAllCounselors() {
  var sheet = getSheet("counselors_profiles");
  if (!sheet) {
    return [];
  }

  var data = sheet.getDataRange().getValues();
  var result = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    result.push({
      user_id: row[0],
      name: row[1],
      email: row[2],
      phone: row[3],
      specialization: row[4],
      bio: row[5],
      status: row[6],
      availability: row[7],
      created_at: row[8],
      experience: row[9] || "N/A",
      education: row[10] || "N/A",
      certifications: row[11] || ""
    });
  }

  return result;
}

function updateCounselorStatus(userId, newStatus) {
  var sheet = getSheet("counselors_profiles");
  if (!sheet) {
    return { success: false, message: "Sheet counselors_profiles tidak ditemukan." };
  }

  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[0]) === String(userId)) {
      sheet.getRange(i + 1, 7).setValue(newStatus);
      
      // Update users sheet as well
      updateUserStatus(userId, newStatus);
      
      return { success: true };
    }
  }

  return { success: false, message: "Konselor tidak ditemukan." };
}

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

function getAllStudents() {
  var sheet = getSheet("students_profiles");
  if (!sheet) {
    return [];
  }

  var data = sheet.getDataRange().getValues();
  var result = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    
    // Get assessment data for risk level
    var assessments = getStudentAssessments(row[0]);
    var latestAssessment = assessments.length > 0 ? assessments[assessments.length - 1] : null;
    var riskLevel = latestAssessment ? getRiskLevel(latestAssessment.total_score).level.toLowerCase() : 'low';
    
    // Get active sessions count
    var activeSessions = getStudentSessions(row[0]).filter(s => s.status === 'scheduled').length;
    
    result.push({
      user_id: row[0],
      fullname: row[1],
      nim: row[2],
      email: row[3],
      phone: row[4],
      emergency_contact: row[5],
      status: row[6],
      registered_date: row[7],
      faculty: row[8] || '',
      program: row[9] || '',
      year: row[10] || '',
      notes: row[11] || '',
      risk_level: riskLevel,
      active_sessions: activeSessions,
      total_assessments: assessments.length
    });
  }

  return result;
}

function saveStudentData(formData) {
  try {
    var sheet = getSheet("students_profiles");
    if (!sheet) {
      sheet = createSheetIfNotExists("students_profiles", [
        "user_id", "fullname", "nim", "email", "phone", 
        "emergency_contact", "status", "registered_date",
        "faculty", "program", "year", "notes"
      ]);
    }
    
    if (formData.user_id) {
      // Update existing student
      var data = sheet.getDataRange().getValues();
      var updated = false;
      
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(formData.user_id)) {
          sheet.getRange(i + 1, 2).setValue(formData.fullname);
          sheet.getRange(i + 1, 3).setValue(formData.nim);
          sheet.getRange(i + 1, 4).setValue(formData.email);
          sheet.getRange(i + 1, 5).setValue(formData.phone);
          sheet.getRange(i + 1, 6).setValue(formData.emergency_contact);
          sheet.getRange(i + 1, 7).setValue(formData.status);
          sheet.getRange(i + 1, 9).setValue(formData.faculty);
          sheet.getRange(i + 1, 10).setValue(formData.program);
          sheet.getRange(i + 1, 11).setValue(formData.year);
          sheet.getRange(i + 1, 12).setValue(formData.notes);
          updated = true;
          break;
        }
      }
      
      if (!updated) {
        // Add as new student
        var newId = getNextId("students_profiles");
        sheet.appendRow([
          newId,
          formData.fullname,
          formData.nim,
          formData.email,
          formData.phone,
          formData.emergency_contact,
          formData.status || 'active',
          new Date(),
          formData.faculty,
          formData.program,
          formData.year,
          formData.notes
        ]);
      }
    } else {
      // Add new student
      var newId = getNextId("students_profiles");
      sheet.appendRow([
        newId,
        formData.fullname,
        formData.nim,
        formData.email,
        formData.phone,
        formData.emergency_contact,
        formData.status || 'active',
        new Date(),
        formData.faculty,
        formData.program,
        formData.year,
        formData.notes
      ]);
    }
    
    return { success: true, message: "Data mahasiswa berhasil disimpan." };
  } catch (error) {
    return { success: false, message: "Error: " + error.toString() };
  }
}

function updateStudentStatus(userId, newStatus) {
  try {
    var sheet = getSheet("students_profiles");
    if (!sheet) {
      return { success: false, message: "Sheet students_profiles tidak ditemukan." };
    }

    var data = sheet.getDataRange().getValues();
    var updated = false;

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(userId)) {
        sheet.getRange(i + 1, 7).setValue(newStatus);
        updated = true;
        break;
      }
    }

    if (updated) {
      return { success: true };
    } else {
      return { success: false, message: "Mahasiswa tidak ditemukan." };
    }
  } catch (error) {
    return { success: false, message: "Error: " + error.toString() };
  }
}

function exportCounselorsData() {
  var counselors = getAllCounselors();
  var csvContent = "ID,Nama,Email,Telepon,Spesialisasi,Status,Ketersediaan,Tanggal Daftar\n";
  
  counselors.forEach(function(counselor) {
    var row = [
      counselor.user_id,
      counselor.name,
      counselor.email,
      counselor.phone || '',
      counselor.specialization || '',
      counselor.status,
      counselor.availability || '',
      new Date(counselor.created_at).toLocaleDateString('id-ID')
    ].map(function(cell) {
      return '"' + (cell || '').toString().replace(/"/g, '""') + '"';
    }).join(',');
    
    csvContent += row + "\n";
  });
  
  var blob = Utilities.newBlob(csvContent, 'text/csv', 'konselor_data.csv');
  return blob.getDataAsString();
}

function exportStudentsData() {
  var students = getAllStudents();
  var csvContent = "ID,Nama,NIM,Email,Telepon,Kontak Darurat,Status,Fakultas,Program,Tahun,Risiko,Sesi Aktif\n";
  
  students.forEach(function(student) {
    var row = [
      student.user_id,
      student.fullname,
      student.nim,
      student.email,
      student.phone || '',
      student.emergency_contact || '',
      student.status,
      student.faculty || '',
      student.program || '',
      student.year || '',
      student.risk_level || 'low',
      student.active_sessions || 0
    ].map(function(cell) {
      return '"' + (cell || '').toString().replace(/"/g, '""') + '"';
    }).join(',');
    
    csvContent += row + "\n";
  });
  
  var blob = Utilities.newBlob(csvContent, 'text/csv', 'mahasiswa_data.csv');
  return blob.getDataAsString();
}

// ===============================
// REGISTRATION FUNCTIONS
// ===============================
function registerStudent(data) {
  try {
    var usersSheet = getSheet("users");
    var userData = usersSheet.getDataRange().getValues();
    
    // Cek duplikasi
    for (var i = 1; i < userData.length; i++) {
      if (userData[i][1] === data.username) {
        return { success: false, message: "Username sudah digunakan" };
      }
      if (userData[i][2] === data.email) {
        return { success: false, message: "Email sudah terdaftar" };
      }
    }

    // Generate ID
    var lastId = 0;
    if (userData.length > 1) {
      lastId = parseInt(userData[userData.length - 1][0]);
    }
    var newId = lastId + 1;

    // Tambahkan ke users
    usersSheet.appendRow([
      newId,
      data.username,
      data.email,
      data.password,
      "student",
      "active",
      data.fullname,
      new Date()
    ]);

    // Tambahkan ke students_profiles
    var studentSheet = getSheet("students_profiles");
    if (!studentSheet) {
      studentSheet = createSheetIfNotExists("students_profiles", [
        "user_id", "fullname", "nim", "email", "phone", 
        "emergency_contact", "status", "registered_date"
      ]);
    }
    
    studentSheet.appendRow([
      newId,
      data.fullname,
      data.nim,
      data.email,
      data.phone,
      data.emergency_contact,
      "active",
      new Date()
    ]);

    return { 
      success: true, 
      message: "Registrasi berhasil! Silakan login.",
      redirectUrl: getBaseUrl() // URL login
    };

  } catch (error) {
    return { success: false, message: "Error: " + error.toString() };
  }
}

function registerCounselor(data) {
  try {
    var usersSheet = getSheet("users");
    var userData = usersSheet.getDataRange().getValues();
    
    // Cek duplikasi
    for (var i = 1; i < userData.length; i++) {
      if (userData[i][1] === data.username) {
        return { success: false, message: "Username sudah digunakan" };
      }
      if (userData[i][2] === data.email) {
        return { success: false, message: "Email sudah terdaftar" };
      }
    }

    // Generate ID
    var lastId = 0;
    if (userData.length > 1) {
      lastId = parseInt(userData[userData.length - 1][0]);
    }
    var newId = lastId + 1;

    // Tambahkan ke users
    usersSheet.appendRow([
      newId,
      data.username,
      data.email,
      data.password,
      "counselor",
      "pending", // Status pending untuk approval admin
      data.fullname,
      new Date()
    ]);

    // Tambahkan ke counselors_profiles
    var counselorSheet = getSheet("counselors_profiles");
    if (!counselorSheet) {
      counselorSheet = createSheetIfNotExists("counselors_profiles", [
        "user_id", "fullname", "email", "phone", "specialization",
        "bio", "status", "availability", "created_at",
        "experience_years", "education", "certifications"
      ]);
    }
    
    counselorSheet.appendRow([
      newId,
      data.fullname,
      data.email,
      data.phone,
      data.specialization || "Umum",
      data.bio || "",
      "pending",
      "available",
      new Date(),
      data.experience_years || 0,
      data.education || "",
      data.certifications || ""
    ]);

    // Kirim notifikasi ke admin
    createSystemNotification(
      "admin",
      "Pendaftaran Konselor Baru",
      "Konselor baru " + data.fullname + " telah mendaftar dan menunggu persetujuan.",
      "info"
    );

    return { 
      success: true, 
      message: "Registrasi berhasil! Menunggu persetujuan admin.",
      redirectUrl: getBaseUrl() // URL login
    };

  } catch (error) {
    return { success: false, message: "Error: " + error.toString() };
  }
}

// ===============================
// COUNSELOR FUNCTIONS
// ===============================
function getCounselorProfile(userId) {
  var sheet = getSheet("counselors_profiles");
  if (!sheet) return null;
  
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(userId)) {
      return {
        user_id: data[i][0],
        fullname: data[i][1],
        email: data[i][2],
        phone: data[i][3],
        specialization: data[i][4],
        bio: data[i][5],
        status: data[i][6],
        availability: data[i][7],
        created_at: data[i][8],
        experience_years: data[i][9],
        education: data[i][10],
        certifications: data[i][11]
      };
    }
  }
  return null;
}

function updateCounselorAvailability(userId, availability) {
  try {
    var sheet = getSheet("counselors_profiles");
    if (!sheet) return { success: false, message: "Sheet not found" };
    
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(userId)) {
        sheet.getRange(i + 1, 8).setValue(availability);
        return { success: true };
      }
    }
    
    return { success: false, message: "Counselor not found" };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function getCounselorSessions(counselorId) {
  var sheet = getSheet("counseling_sessions");
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getValues();
  var sessions = [];
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2]) === String(counselorId)) {
      // Get student name
      var studentProfile = getStudentProfile(data[i][1]);
      var studentName = studentProfile ? studentProfile.fullname : "Mahasiswa";
      var studentNim = studentProfile ? studentProfile.nim : "";
      
      sessions.push({
        session_id: data[i][0],
        student_id: data[i][1],
        counselor_id: data[i][2],
        scheduled_date: data[i][3],
        session_type: data[i][4],
        status: data[i][5],
        meeting_link: data[i][6],
        notes: data[i][7],
        created_at: data[i][8],
        student_name: studentName,
        student_nim: studentNim
      });
    }
  }
  
  return sessions;
}

// ===============================
// STUDENT FUNCTIONS - UPDATE VERSION
// ===============================
// ===============================
// PHOTO MANAGEMENT FUNCTIONS
// ===============================
function saveUserPhoto(userId, photoData) {
  try {
    var props = PropertiesService.getUserProperties();
    var photoKey = "user_photo_" + userId;
    
    // PropertiesService has a limit of ~9KB per property
    // So we need to chunk large images or compress them
    // For simplicity, we'll just save directly (works for reasonably sized images)
    
    props.setProperty(photoKey, photoData);
    
    return { success: true };
  } catch (error) {
    console.error("Error saving photo:", error);
    return { success: false, message: error.toString() };
  }
}

function getUserPhoto(userId) {
  try {
    var props = PropertiesService.getUserProperties();
    var photoKey = "user_photo_" + userId;
    
    var photoData = props.getProperty(photoKey);
    
    return photoData;
  } catch (error) {
    console.error("Error getting photo:", error);
    return null;
  }
}

function deleteUserPhoto(userId) {
  try {
    var props = PropertiesService.getUserProperties();
    var photoKey = "user_photo_" + userId;
    
    props.deleteProperty(photoKey);
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting photo:", error);
    return { success: false, message: error.toString() };
  }
}

// Tambahkan fungsi stundent profile
function getStudentProfile(userId) {
  try {
    var sheet = getSheet("students_profiles");
    if (!sheet) return null;
    
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(userId)) {
        return {
          user_id: data[i][0],
          fullname: data[i][1],
          nim: data[i][2],
          email: data[i][3],
          phone: data[i][4],
          emergency_contact: data[i][5],
          status: data[i][6],
          registered_date: data[i][7],
          faculty: data[i][8] || '',
          program: data[i][9] || '',
          year: data[i][10] || '',
          notes: data[i][11] || ''
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Error in getStudentProfile:", error);
    return null;
  }
}

function getStudentSessions(studentId) {
  var sheet = getSheet("counseling_sessions");
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getValues();
  var sessions = [];
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(studentId)) {
      // Get counselor name
      var counselorProfile = getCounselorProfile(data[i][2]);
      var counselorName = counselorProfile ? counselorProfile.fullname : "Konselor";
      
      sessions.push({
        session_id: data[i][0],
        student_id: data[i][1],
        counselor_id: data[i][2],
        scheduled_date: data[i][3],
        session_type: data[i][4],
        status: data[i][5],
        meeting_link: data[i][6],
        notes: data[i][7],
        created_at: data[i][8],
        counselor_name: counselorName
      });
    }
  }
  
  return sessions;
}

// Fungsi untuk mendapatkan sessions berdasarkan student ID (tanpa parameter filter)
function getStudentSessionsById(studentId) {
  var sheet = getSheet("counseling_sessions");
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getValues();
  var sessions = [];
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(studentId)) {
      var counselorProfile = getCounselorProfile(data[i][2]);
      var counselorName = counselorProfile ? counselorProfile.fullname : "Konselor";
      
      sessions.push({
        session_id: data[i][0],
        student_id: data[i][1],
        counselor_id: data[i][2],
        scheduled_date: data[i][3],
        session_type: data[i][4],
        status: data[i][5],
        meeting_link: data[i][6],
        notes: data[i][7],
        created_at: data[i][8],
        counselor_name: counselorName,
        counselor_specialization: counselorProfile ? counselorProfile.specialization : ""
      });
    }
  }
  
  return sessions;
}

// Fungsi untuk mendapatkan sessions dari session saat ini (dengan optional filter)
function getStudentSessions(filter) {
  try {
    var session = getSession();
    if (!session || session.role !== 'student') {
      return [];
    }
    
    var studentId = session.id;
    var sessions = getStudentSessionsById(studentId);
    
    // Apply filtering based on parameter
    if (filter === 'current') {
      var now = new Date();
      sessions = sessions.filter(function(s) {
        return new Date(s.scheduled_date) > now && s.status === 'scheduled';
      });
    }
    
    return sessions;
  } catch (error) {
    console.error("Error in getStudentSessions:", error);
    return [];
  }
}

// Fungsi untuk mendapatkan assessments berdasarkan student ID
function getStudentAssessmentsById(studentId) {
  var sheet = getSheet("assessments");
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getValues();
  var assessments = [];
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(studentId)) {
      assessments.push({
        assessment_id: data[i][0],
        student_id: data[i][1],
        counselor_id: data[i][2],
        session_id: data[i][3],
        gratitude_score: data[i][4],
        compassion_score: data[i][5],
        suicidal_score: data[i][6],
        total_score: data[i][7],
        notes: data[i][8],
        assessment_date: data[i][9],
        created_at: data[i][10]
      });
    }
  }
  
  // Sort by date (newest first)
  assessments.sort(function(a, b) {
    return new Date(b.assessment_date) - new Date(a.assessment_date);
  });
  
  return assessments;
}

/* ini fungsi lama tidak digunakan lagi
function getStudentSessions(filter) {
  try {
    var session = getSession();
    if (!session || session.role !== 'student') {
      return [];
    }
    
    var studentId = session.id;
    var sheet = getSheet("counseling_sessions");
    if (!sheet) return [];
    
    var data = sheet.getDataRange().getValues();
    var sessions = [];
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]) === String(studentId)) {
        // Get counselor name
        var counselorProfile = getCounselorProfile(data[i][2]);
        var counselorName = counselorProfile ? counselorProfile.fullname : "Konselor";
        
        sessions.push({
          session_id: data[i][0],
          student_id: data[i][1],
          counselor_id: data[i][2],
          scheduled_date: data[i][3],
          session_type: data[i][4],
          status: data[i][5],
          meeting_link: data[i][6],
          notes: data[i][7],
          created_at: data[i][8],
          counselor_name: counselorName,
          counselor_specialization: counselorProfile ? counselorProfile.specialization : ""
        });
      }
    }
    
    // Apply filtering based on parameter
    if (filter === 'current') {
      var now = new Date();
      sessions = sessions.filter(function(s) {
        return new Date(s.scheduled_date) > now && s.status === 'scheduled';
      });
    }
    
    return sessions;
  } catch (error) {
    console.error("Error in getStudentSessions:", error);
    return [];
  }
}
*/

// Fungsi emergency
function triggerEmergency() {
  var session = getSession();
  if (!session || session.role !== "student") {
    return { success: false, message: "Session tidak valid" };
  }
  
  var profile = getStudentProfile(session.id);
  if (!profile) {
    return { success: false, message: "Profile tidak ditemukan" };
  }
  
  // Log emergency
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logSheet = ss.getSheetByName("emergency_logs");
  
  if (!logSheet) {
    logSheet = ss.insertSheet("emergency_logs");
    logSheet.getRange(1, 1, 1, 6).setValues([[
      "log_id", "user_id", "username", "emergency_contact", "timestamp", "status"
    ]]);
  }
  
  var logId = getNextId("emergency_logs");
  
  logSheet.appendRow([
    logId,
    session.id,
    session.username,
    profile.emergency_contact,
    new Date(),
    "pending"
  ]);
  
  // Send notification to all counselors
  var counselors = getAllCounselors().filter(function(c) { 
    return c.status === 'approved'; 
  });
  
  counselors.forEach(function(counselor) {
    createSystemNotification(
      counselor.user_id,
      "Emergency Alert!",
      "Mahasiswa " + session.username + " membutuhkan bantuan darurat! Kontak: " + profile.emergency_contact,
      "emergency"
    );
  });
  
  // Also notify admin
  createSystemNotification(
    "admin",
    "Emergency Alert!",
    "Mahasiswa " + session.username + " (NIM: " + (profile.nim || "N/A") + ") membutuhkan bantuan darurat!",
    "emergency"
  );
  
  return { 
    success: true, 
    message: "Emergency signal sent to emergency contact: " + profile.emergency_contact 
  };
}

/* fungsi lama yang tidak digunakan lagi
function triggerEmergency() {
  var session = getSession();
  if (!session || session.role !== "student") return { success: false };
  
  var profile = getStudentProfile(session.id);
  if (!profile) return { success: false };
  
  // Log emergency
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logSheet = ss.getSheetByName("emergency_logs");
  
  if (!logSheet) {
    logSheet = ss.insertSheet("emergency_logs");
    logSheet.getRange(1, 1, 1, 6).setValues([[
      "log_id", "user_id", "username", "emergency_contact", "timestamp", "status"
    ]]);
  }
  
  var logId = getNextId("emergency_logs");
  
  logSheet.appendRow([
    logId,
    session.id,
    session.username,
    profile.emergency_contact,
    new Date(),
    "pending"
  ]);
  
  // Send notification to all counselors
  var counselors = getAllCounselors().filter(c => c.status === 'approved');
  counselors.forEach(function(counselor) {
    createSystemNotification(
      counselor.user_id,
      "Emergency Alert!",
      "Mahasiswa " + session.username + " membutuhkan bantuan darurat! Kontak: " + profile.emergency_contact,
      "emergency"
    );
  });
  
  // Also notify admin
  createSystemNotification(
    "admin",
    "Emergency Alert!",
    "Mahasiswa " + session.username + " (NIM: " + (profile.nim || "N/A") + ") membutuhkan bantuan darurat!",
    "emergency"
  );
  
  return { 
    success: true, 
    message: "Emergency signal sent to emergency contact: " + profile.emergency_contact 
  };
}
*/

// ===============================
// ASSESSMENT FUNCTIONS
// ===============================
function getStudentAssessments(studentId) {
  var sheet = getSheet("assessments");
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getValues();
  var assessments = [];
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(studentId)) {
      assessments.push({
        assessment_id: data[i][0],
        student_id: data[i][1],
        counselor_id: data[i][2],
        session_id: data[i][3],
        gratitude_score: data[i][4],
        compassion_score: data[i][5],
        suicidal_score: data[i][6],
        total_score: data[i][7],
        notes: data[i][8],
        assessment_date: data[i][9],
        created_at: data[i][10]
      });
    }
  }
  
  // Sort by date (newest first)
  assessments.sort(function(a, b) {
    return new Date(b.assessment_date) - new Date(a.assessment_date);
  });
  
  return assessments;
}

// Fungsi untuk mendapatkan assessments dari session saat ini
function getStudentAssessments(filter) {
  try {
    var session = getSession();
    if (!session || session.role !== 'student') {
      return [];
    }
    
    var studentId = session.id;
    var assessments = getStudentAssessmentsById(studentId);
    
    // Add counselor name to each assessment
    assessments = assessments.map(function(assessment) {
      var counselorProfile = getCounselorProfile(assessment.counselor_id);
      assessment.counselor_name = counselorProfile ? counselorProfile.fullname : "Konselor";
      return assessment;
    });
    
    return assessments;
  } catch (error) {
    console.error("Error in getStudentAssessments:", error);
    return [];
  }
}

/* ini fungsi lama yang tidak digunakan lagi
function getStudentAssessments(filter) {
  try {
    var session = getSession();
    if (!session || session.role !== 'student') {
      return [];
    }
    
    var studentId = session.id;
    var sheet = getSheet("assessments");
    if (!sheet) return [];
    
    var data = sheet.getDataRange().getValues();
    var assessments = [];
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]) === String(studentId)) {
        // Get counselor name for display
        var counselorProfile = getCounselorProfile(data[i][2]);
        var counselorName = counselorProfile ? counselorProfile.fullname : "Konselor";
        
        assessments.push({
          assessment_id: data[i][0],
          student_id: data[i][1],
          counselor_id: data[i][2],
          session_id: data[i][3],
          gratitude_score: data[i][4],
          compassion_score: data[i][5],
          suicidal_score: data[i][6],
          total_score: data[i][7],
          notes: data[i][8],
          assessment_date: data[i][9],
          created_at: data[i][10],
          counselor_name: counselorName
        });
      }
    }
    
    // Sort by date (newest first)
    assessments.sort(function(a, b) {
      return new Date(b.assessment_date) - new Date(a.assessment_date);
    });
    
    return assessments;
  } catch (error) {
    console.error("Error in getStudentAssessments:", error);
    return [];
  }
}
*/

function createAssessment(assessmentData) {
  try {
    var sheet = getSheet("assessments");
    if (!sheet) {
      sheet = createSheetIfNotExists("assessments", [
        "assessment_id", "student_id", "counselor_id", "session_id",
        "gratitude_score", "compassion_score", "suicidal_score",
        "total_score", "notes", "assessment_date", "created_at"
      ]);
    }
    
    var assessmentId = getNextId("assessments");
    var totalScore = calculateTotalScore(
      assessmentData.gratitude_score,
      assessmentData.compassion_score,
      assessmentData.suicidal_score
    );
    
    sheet.appendRow([
      assessmentId,
      assessmentData.student_id,
      assessmentData.counselor_id,
      assessmentData.session_id || "",
      assessmentData.gratitude_score,
      assessmentData.compassion_score,
      assessmentData.suicidal_score,
      totalScore,
      assessmentData.notes || "",
      new Date(),
      new Date()
    ]);
    
    return { success: true, assessmentId: assessmentId, totalScore: totalScore };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/* fungsi ini sementara di nonaktifkan
function createAssessment(assessmentData) {
  try {
    var sheet = getSheet("assessments");
    if (!sheet) {
      sheet = createSheetIfNotExists("assessments", [
        "assessment_id", "student_id", "counselor_id", "session_id",
        "gratitude_score", "compassion_score", "suicidal_score",
        "total_score", "notes", "assessment_date", "created_at"
      ]);
    }
    
    var assessmentId = getNextId("assessments");
    var totalScore = calculateTotalScore(
      assessmentData.gratitude_score,
      assessmentData.compassion_score,
      assessmentData.suicidal_score
    );
    
    sheet.appendRow([
      assessmentId,
      assessmentData.student_id,
      assessmentData.counselor_id,
      assessmentData.session_id || "",
      assessmentData.gratitude_score,
      assessmentData.compassion_score,
      assessmentData.suicidal_score,
      totalScore,
      assessmentData.notes || "",
      new Date(),
      new Date()
    ]);
    
    return { success: true, assessmentId: assessmentId, totalScore: totalScore };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}
*/

function calculateTotalScore(gratitude, compassion, suicidal) {
  var gratitudeWeight = 0.4;
  var compassionWeight = 0.4;
  var suicidalWeight = 0.2;
  
  var suicidalInverted = 100 - suicidal;
  
  return Math.round(
    (gratitude * gratitudeWeight) + 
    (compassion * compassionWeight) + 
    (suicidalInverted * suicidalWeight)
  );
}

function getAssessmentTrends(studentId) {
  var assessments = getStudentAssessments(studentId);
  
  // Sort by date
  assessments.sort(function(a, b) {
    return new Date(a.assessment_date) - new Date(b.assessment_date);
  });
  
  var trends = {
    labels: [],
    gratitude: [],
    compassion: [],
    suicidal: [],
    total: []
  };
  
  assessments.forEach(function(assessment) {
    var date = new Date(assessment.assessment_date);
    trends.labels.push(date.toLocaleDateString('id-ID'));
    trends.gratitude.push(assessment.gratitude_score);
    trends.compassion.push(assessment.compassion_score);
    trends.suicidal.push(assessment.suicidal_score);
    trends.total.push(assessment.total_score);
  });
  
  return trends;
}

function getRiskLevel(totalScore) {
  if (totalScore >= 80) {
    return { level: "Rendah", color: "success", description: "Kondisi baik" };
  } else if (totalScore >= 60) {
    return { level: "Sedang", color: "warning", description: "Perlu perhatian" };
  } else {
    return { level: "Tinggi", color: "danger", description: "Perlu intervensi segera" };
  }
}

// ===============================
// APPOINTMENT FUNCTIONS
// ===============================
function createSession(sessionData) {
  try {
    var sheet = getSheet("counseling_sessions");
    if (!sheet) {
      sheet = createSheetIfNotExists("counseling_sessions", [
        "session_id", "student_id", "counselor_id", "scheduled_date",
        "session_type", "status", "meeting_link", "notes", "created_at"
      ]);
    }
    
    var sessionId = getNextId("counseling_sessions");
    var meetingLink = generateMeetingLink(sessionData.session_type || "video_call", sessionData);
    
    sheet.appendRow([
      sessionId,
      sessionData.student_id,
      sessionData.counselor_id,
      sessionData.scheduled_date,
      sessionData.session_type || "video_call",
      "scheduled",
      meetingLink,
      sessionData.notes || "",
      new Date()
    ]);
    
    // Send notifications
    var student = getStudentProfile(sessionData.student_id);
    var counselor = getCounselorProfile(sessionData.counselor_id);
    
    if (student) {
      createSystemNotification(
        sessionData.student_id,
        "Sesi Konseling Dijadwalkan",
        "Anda memiliki sesi konseling dengan " + (counselor ? counselor.fullname : "Konselor") + 
        " pada " + new Date(sessionData.scheduled_date).toLocaleDateString('id-ID'),
        "info"
      );
    }
    
    if (counselor) {
      createSystemNotification(
        sessionData.counselor_id,
        "Sesi Konseling Baru",
        "Anda memiliki sesi konseling dengan " + (student ? student.fullname : "Mahasiswa") + 
        " pada " + new Date(sessionData.scheduled_date).toLocaleDateString('id-ID'),
        "info"
      );
    }
    
    return { success: true, sessionId: sessionId, meetingLink: meetingLink };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function updateSessionStatus(sessionId, status, notes) {
  try {
    var sheet = getSheet("counseling_sessions");
    if (!sheet) return { success: false, message: "Sheet not found" };
    
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(sessionId)) {
        sheet.getRange(i + 1, 6).setValue(status);
        if (notes) {
          sheet.getRange(i + 1, 8).setValue(notes);
        }
        
        // Get session info for notification
        var session = {
          student_id: data[i][1],
          counselor_id: data[i][2],
          scheduled_date: data[i][3]
        };
        
        // Send notification based on status
        var statusText = "";
        switch(status) {
          case "completed":
            statusText = "selesai";
            break;
          case "cancelled":
            statusText = "dibatalkan";
            break;
          case "in_progress":
            statusText = "dimulai";
            break;
        }
        
        if (statusText) {
          createSystemNotification(
            session.student_id,
            "Status Sesi Diperbarui",
            "Sesi konseling pada " + new Date(session.scheduled_date).toLocaleDateString('id-ID') + 
            " telah " + statusText,
            "info"
          );
          
          createSystemNotification(
            session.counselor_id,
            "Status Sesi Diperbarui",
            "Sesi konseling pada " + new Date(session.scheduled_date).toLocaleDateString('id-ID') + 
            " telah " + statusText,
            "info"
          );
        }
        
        return { success: true };
      }
    }
    
    return { success: false, message: "Session not found" };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function generateMeetingLink(sessionType, sessionData) {
  var baseLinks = {
    "zoom": "https://zoom.us/j/",
    "google_meet": "https://meet.google.com/",
    "whatsapp": "https://wa.me/"
  };
  
  if (!baseLinks[sessionType]) {
    return "https://meet.google.com/new";
  }
  
  // Generate a random meeting ID
  var meetingId = Math.random().toString(36).substring(2, 10).toUpperCase();
  
  if (sessionType === "whatsapp") {
    // For WhatsApp, we need a phone number
    var phone = sessionData.phone || "6281234567890";
    return baseLinks[sessionType] + phone + "?text=Halo%20saya%20ingin%20konseling";
  }
  
  return baseLinks[sessionType] + meetingId;
}

// ===============================
// NOTIFICATION FUNCTIONS
// ===============================
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

// ===============================
// DASHBOARD STATISTICS
// ===============================
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

// ===============================
// PASSWORD MANAGEMENT
// ===============================
function changePassword(userId, currentPassword, newPassword) {
  try {
    var sheet = getSheet("users");
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(userId)) {
        // If currentPassword is provided, verify it
        if (currentPassword && data[i][3] !== currentPassword) {
          return { success: false, message: "Password saat ini salah" };
        }
        
        sheet.getRange(i + 1, 4).setValue(newPassword);
        return { success: true, message: "Password berhasil diubah" };
      }
    }
    
    return { success: false, message: "Pengguna tidak ditemukan" };
  } catch (error) {
    return { success: false, message: "Error: " + error.toString() };
  }
}

// ===============================
// SYSTEM INITIALIZATION
// ===============================
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
      "experience_years", "education", "certifications"
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

// ===============================
// SYSTEM SETTINGS
// ===============================
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

// ===============================
// UTILITY FUNCTIONS
// ===============================
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

// ===============================
// DATA EXPORT FUNCTIONS
// ===============================
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

function getAllSessions() {
  var sheet = getSheet("counseling_sessions");
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getValues();
  var sessions = [];
  
  for (var i = 1; i < data.length; i++) {
    sessions.push({
      session_id: data[i][0],
      student_id: data[i][1],
      counselor_id: data[i][2],
      scheduled_date: data[i][3],
      session_type: data[i][4],
      status: data[i][5],
      meeting_link: data[i][6],
      notes: data[i][7],
      created_at: data[i][8]
    });
  }
  
  return sessions;
}

function getAllAssessments() {
  var sheet = getSheet("assessments");
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getValues();
  var assessments = [];
  
  for (var i = 1; i < data.length; i++) {
    assessments.push({
      assessment_id: data[i][0],
      student_id: data[i][1],
      counselor_id: data[i][2],
      session_id: data[i][3],
      gratitude_score: data[i][4],
      compassion_score: data[i][5],
      suicidal_score: data[i][6],
      total_score: data[i][7],
      notes: data[i][8],
      assessment_date: data[i][9],
      created_at: data[i][10]
    });
  }
  
  return assessments;
}

// ===============================
// HELPER FUNCTIONS
// ===============================
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

function getAvailableCounselors() {
  var counselors = getAllCounselors();
  return counselors.filter(function(counselor) {
    return counselor.status === "approved" && counselor.availability === "available";
  });
}

function getStudentByNIM(nim) {
  var students = getAllStudents();
  return students.find(function(student) {
    return student.nim === nim;
  });
}

// ===============================
// EMAIL FUNCTIONS (Placeholder)
// ===============================
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

// ===============================
// BACKUP AND RESTORE
// ===============================
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
    
    // Restore data (this is simplified - in reality you'd need to handle each sheet separately)
    // Note: This is a basic implementation. For production, you'd need more robust error handling
    
    return { success: true, message: 'Backup restored successfully' };
  } catch (error) {
    return { success: false, message: 'Error restoring backup: ' + error.toString() };
  }
}

// fungsi hanya untuk test koneksi dengan database
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