// ===============================
// AUTHENTICATION & SESSION MANAGEMENT
// ===============================

// Session management
function setSession(user) {
  var props = PropertiesService.getUserProperties();
  props.setProperty("session_user", JSON.stringify(user));
}

function getSession() {
  var props = PropertiesService.getUserProperties();
  var data = props.getProperty("session_user");
  return data ? JSON.parse(data) : null;
}

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

// Login function
function login(username, password) {
  try {
    console.log("=== LOGIN ATTEMPT START ===");
    console.log("Username/Email:", username);
    console.log("Password length:", password ? password.length : 0);
    
    var sheet = getSheet("users");
    if (!sheet) {
      console.error("❌ Sheet 'users' tidak ditemukan!");
      return { 
        success: false, 
        message: "System error: Database tidak tersedia." 
      };
    }

    var data = sheet.getDataRange().getValues();
    console.log("Total rows in users sheet:", data.length);
    
    if (data.length > 0) {
      console.log("Header columns:", data[0]);
    }
    
    if (data.length <= 1) {
      console.error("❌ Tidak ada data user di database");
      return {
        success: false,
        message: "Tidak ada user terdaftar dalam sistem."
      };
    }

    console.log("Mencari user dengan username/email:", username);

    // Loop through all users
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      
      // Skip empty rows
      if (!row[0] && !row[1]) continue;
      
      var dbId = row[0] ? String(row[0]).trim() : "";
      var dbUsername = row[1] ? String(row[1]).trim() : "";
      var dbEmail = row[2] ? String(row[2]).trim() : "";
      var dbPassword = row[3] ? String(row[3]).trim() : "";
      var dbRole = row[4] ? String(row[4]).trim().toLowerCase() : "";
      var dbStatus = row[5] ? String(row[5]).trim().toLowerCase() : "";
      var dbFullname = row[6] ? String(row[6]).trim() : dbUsername;
      
      // Check username or email match (case-insensitive)
      var inputUsername = String(username).trim().toLowerCase();
      var isUsernameMatch = (dbUsername.toLowerCase() === inputUsername);
      var isEmailMatch = (dbEmail.toLowerCase() === inputUsername);
      
      if (isUsernameMatch || isEmailMatch) {
        console.log("✅ User found!");
        
        // Check password (case-sensitive)
        var inputPassword = String(password).trim();
        var dbPasswordTrimmed = String(dbPassword).trim();
        
        if (inputPassword !== dbPasswordTrimmed) {
          console.log("❌ Password tidak cocok");
          return {
            success: false,
            message: "Username/Email atau password salah."
          };
        }

        console.log("✅ Password cocok!");
        
        // Check account status
        if (dbStatus !== "active") {
          console.log("⚠️ Account not active. Status:", dbStatus);
          return {
            success: false,
            message: "Akun belum aktif / belum disetujui admin. Status: " + dbStatus
          };
        }

        // Login successful - create user object
        var user = {
          id: dbId,
          username: dbUsername,
          email: dbEmail,
          role: dbRole,
          fullname: dbFullname
        };

        console.log("Setting session for user:", user);
        setSession(user);

        var redirectUrl = getPageUrl(dbRole);
        
        console.log("✅ LOGIN SUCCESSFUL");
        console.log("User:", user.username);
        console.log("Role:", user.role);
        console.log("Redirect URL:", redirectUrl);

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
    console.error("❌ LOGIN ERROR:", error);
    console.error("Error stack:", error.stack);
    return { 
      success: false, 
      message: "System error: " + error.toString() 
    };
  }
}

// Logout function
function serverLogout() {
  try {
    // Clear session
    PropertiesService.getUserProperties().deleteProperty("session_user");
    
    // Get base URL for redirect
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

// Password management
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