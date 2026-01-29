// ===============================
// STUDENTS MANAGEMENT FUNCTIONS
// ===============================

// Get all students
function getAllStudents() {
  console.log("=== getAllStudents START ===");
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    console.log("✅ Spreadsheet opened:", ss.getName());
    
    var sheet = ss.getSheetByName("students_profiles");
    
    if (!sheet) {
      console.log("⚠️ Sheet 'students_profiles' tidak ditemukan");
      return [];
    }
    
    console.log("✅ Sheet 'students_profiles' ditemukan");
    
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    
    console.log("Sheet dimensions:", lastRow, "rows x", lastCol, "cols");
    
    if (lastRow <= 1) {
      console.log("ℹ️ Sheet hanya memiliki header atau kosong");
      return [];
    }
    
    var data = sheet.getDataRange().getValues();
    console.log("Data retrieved:", data.length, "rows");
    
    var result = [];
    var headers = data[0];
    
    console.log("Headers:", headers);
    
    // Loop mulai dari baris 2 (index 1)
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      
      // Skip baris kosong
      if (!row[0] && !row[1]) {
        console.log("⏭️ Skipping empty row", i);
        continue;
      }
      
      // Default values untuk mencegah error
      var riskLevel = 'low';
      var activeSessions = 0;
      var totalAssessments = 0;
      
      // Hitung risk level berdasarkan assessments
      try {
        var assessments = getStudentAssessmentsById(String(row[0]));
        if (assessments && assessments.length > 0) {
          totalAssessments = assessments.length;
          
          // Ambil assessment terbaru
          var latestAssessment = assessments[assessments.length - 1];
          if (latestAssessment && latestAssessment.total_score !== undefined) {
            var score = parseInt(latestAssessment.total_score);
            if (score >= 80) {
              riskLevel = 'low';
            } else if (score >= 60) {
              riskLevel = 'medium';
            } else {
              riskLevel = 'high';
            }
          }
        }
      } catch (assessmentError) {
        console.log("⚠️ Assessment error for student", row[0], ":", assessmentError.message);
      }
      
      // Hitung active sessions
      try {
        var sessions = getStudentSessionsById(String(row[0]));
        if (sessions && Array.isArray(sessions)) {
          activeSessions = sessions.filter(function(s) {
            return s.status === 'scheduled';
          }).length;
        }
      } catch (sessionError) {
        console.log("⚠️ Session error for student", row[0], ":", sessionError.message);
      }
      
      // Format tanggal dengan benar
      var registeredDate = "";
      if (row[7]) {
        try {
          // Jika sudah Date object
          if (row[7] instanceof Date) {
            registeredDate = row[7].toISOString();
          } 
          // Jika string
          else if (typeof row[7] === 'string') {
            var dateObj = new Date(row[7]);
            if (!isNaN(dateObj.getTime())) {
              registeredDate = dateObj.toISOString();
            } else {
              registeredDate = row[7]; // Simpan string asli
            }
          }
          // Lainnya
          else {
            registeredDate = String(row[7]);
          }
        } catch (dateError) {
          console.log(`⚠️ Date error for ${row[0]}: ${dateError.message}`);
          registeredDate = "";
        }
      }
      
      // Buat student object
      var student = {
        user_id: String(row[0] || ''),
        fullname: String(row[1] || ''),
        nim: String(row[2] || ''),
        email: String(row[3] || ''),
        phone: String(row[4] || ''),
        emergency_contact: String(row[5] || ''),
        status: String(row[6] || 'active').toLowerCase(),
        registered_date: registeredDate,
        faculty: String(row[8] || ''),
        program: String(row[9] || ''),
        year: String(row[10] || ''),
        notes: String(row[11] || ''),
        risk_level: riskLevel,
        active_sessions: activeSessions,
        total_assessments: totalAssessments
      };
      
      result.push(student);
      console.log("✅ Added student:", student.fullname, "(ID:", student.user_id, ")");
    }
    
    console.log("=== getAllStudents END ===");
    console.log("Total students processed:", result.length);
    
    return result;
    
  } catch (error) {
    console.error("❌ FATAL ERROR in getAllStudents:", error);
    console.error("Stack:", error.stack);
    return [];
  }
}

// Get individual student profile
function getStudentProfile(userId) {
  try {
    var sheet = getSheet("students_profiles");
    if (!sheet) return null;
    
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      
      // Cek beberapa kemungkinan kolom ID
      if (String(row[0]) === String(userId) || 
          String(row[2]) === String(userId)) { // NIM sebagai alternatif
        
        // Format tanggal
        var registeredDate = "";
        try {
          if (row[7]) {
            registeredDate = String(row[7]);
          }
        } catch (dateError) {
          console.log(`⚠️ Date error for ${row[0]}: ${dateError.message}`);
          registeredDate = "";
        }
        
        return {
          user_id: row[0] || '',
          fullname: row[1] || '',
          nim: row[2] || '',
          email: row[3] || '',
          phone: row[4] || '',
          emergency_contact: row[5] || '',
          status: row[6] || 'active',
          registered_date: registeredDate,
          faculty: row[8] || '',
          program: row[9] || '',
          year: row[10] || '',
          notes: row[11] || ''
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Error in getStudentProfile:", error);
    return null;
  }
}

// Update student data
function updateStudentData(formData) {
  try {
    console.log("=== updateStudentData START ===");
    console.log("Data yang diterima:", JSON.stringify(formData, null, 2));
    
    // 1. Cek sheet students_profiles
    var sheet = getSheet("students_profiles");
    if (!sheet) {
      console.error("❌ Sheet 'students_profiles' tidak ditemukan");
      return {
        success: false,
        message: "Sheet data mahasiswa tidak ditemukan"
      };
    }
    
    console.log("✅ Sheet 'students_profiles' ditemukan");
    
    // 2. Ambil semua data dari sheet
    var data = sheet.getDataRange().getValues();
    console.log("Total rows in sheet:", data.length);
    
    if (data.length <= 1) {
      console.log("ℹ️ Tidak ada data mahasiswa di sheet");
      return {
        success: false,
        message: "Tidak ada data mahasiswa ditemukan"
      };
    }
    
    // 3. Cari index baris berdasarkan user_id
    var headers = data[0];
    var userIdIndex = headers.indexOf("user_id");
    var idIndex = headers.indexOf("id"); // Alternatif jika kolom user_id tidak ada
    
    console.log("Headers:", headers);
    console.log("user_id index:", userIdIndex);
    console.log("id index:", idIndex);
    
    if (userIdIndex === -1 && idIndex === -1) {
      console.error("❌ Kolom user_id atau id tidak ditemukan di header");
      return {
        success: false,
        message: "Format sheet tidak valid: kolom user_id tidak ditemukan"
      };
    }
    
    var rowIndex = -1;
    var searchId = formData.user_id || "";
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var rowUserId = (userIdIndex !== -1) ? row[userIdIndex] : "";
      var rowId = (idIndex !== -1) ? row[idIndex] : "";
      
      if (rowUserId === searchId || rowId === searchId) {
        rowIndex = i + 1; // +1 karena array dimulai dari 0, tapi spreadsheet dari 1
        console.log(`✅ Mahasiswa ditemukan di baris ${rowIndex}`);
        break;
      }
    }
    
    if (rowIndex === -1) {
      console.error(`❌ Mahasiswa dengan ID '${searchId}' tidak ditemukan`);
      return {
        success: false,
        message: "Data mahasiswa tidak ditemukan"
      };
    }
    
    // 4. Mapping data ke kolom yang sesuai
    var updateData = {};
    
    // Definisikan mapping field form ke kolom spreadsheet
    var fieldMapping = {
      "fullname": ["fullname", "nama", "name"],
      "nim": ["nim", "student_id"],
      "email": ["email", "email_address"],
      "phone": ["phone", "telepon", "phone_number"],
      "faculty": ["faculty", "fakultas"],
      "program": ["program", "program_studi", "prodi"],
      "year": ["year", "tahun", "angkatan"],
      "emergency_contact": ["emergency_contact", "kontak_darurat"],
      "status": ["status", "status_mahasiswa"],
      "risk_level": ["risk_level", "tingkat_risiko"],
      "notes": ["notes", "catatan"]
    };
    
    // Untuk setiap field di formData, cari kolom yang sesuai
    Object.keys(formData).forEach(function(fieldName) {
      if (fieldMapping[fieldName]) {
        var possibleColumns = fieldMapping[fieldName];
        var columnIndex = -1;
        
        // Cari kolom yang ada di headers
        for (var j = 0; j < possibleColumns.length; j++) {
          var colIndex = headers.indexOf(possibleColumns[j]);
          if (colIndex !== -1) {
            columnIndex = colIndex;
            console.log(`   ${fieldName} -> kolom ${possibleColumns[j]} (index: ${colIndex})`);
            break;
          }
        }
        
        if (columnIndex !== -1) {
          updateData[columnIndex] = formData[fieldName];
        } else {
          console.log(`   ⚠️ Kolom untuk '${fieldName}' tidak ditemukan di sheet`);
        }
      }
    });
    
    // 5. Update data di spreadsheet
    console.log("Data yang akan diupdate:", updateData);
    
    Object.keys(updateData).forEach(function(colIndex) {
      var cell = sheet.getRange(rowIndex, parseInt(colIndex) + 1); // +1 karena spreadsheet index mulai dari 1
      cell.setValue(updateData[colIndex]);
      console.log(`   📝 Update baris ${rowIndex}, kolom ${parseInt(colIndex) + 1}: ${updateData[colIndex]}`);
    });
    
    // 6. Tambah timestamp update jika ada kolom 'updated_at'
    var updatedAtIndex = headers.indexOf("updated_at");
    if (updatedAtIndex !== -1) {
      sheet.getRange(rowIndex, updatedAtIndex + 1).setValue(new Date());
      console.log("   ⏰ Timestamp updated_at ditambahkan");
    }
    
    // 7. Log perubahan
    console.log(`✅ Data mahasiswa ${searchId} berhasil diperbarui`);
    
    // 8. Jika ada perubahan risk_level, log di sheet lain (opsional)
    if (formData.risk_level) {
      logRiskLevelChange(searchId, formData.risk_level, formData.fullname || "Unknown");
    }
    
    return {
      success: true,
      message: "Data mahasiswa berhasil diperbarui"
    };
    
  } catch (error) {
    console.error("❌ ERROR in updateStudentData:", error);
    console.error(error.stack);
    return {
      success: false,
      message: "Terjadi kesalahan: " + error.toString()
    };
  }
}

// Save student data (create or update)
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

// Update student status
function updateStudentStatus(userId, newStatus) {
  try {
    console.log(`=== updateStudentStatus START ===`);
    console.log(`User ID: ${userId}, New Status: ${newStatus}`);
    
    var sheet = getSheet("students_profiles");
    if (!sheet) {
      return {
        success: false,
        message: "Sheet data mahasiswa tidak ditemukan"
      };
    }
    
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    
    // Cari kolom user_id/id dan status
    var userIdIndex = headers.indexOf("user_id");
    var idIndex = headers.indexOf("id");
    var statusIndex = headers.indexOf("status");
    
    if (statusIndex === -1) {
      return {
        success: false,
        message: "Kolom status tidak ditemukan di sheet"
      };
    }
    
    var rowIndex = -1;
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var rowUserId = (userIdIndex !== -1) ? row[userIdIndex] : "";
      var rowId = (idIndex !== -1) ? row[idIndex] : "";
      
      if (rowUserId === userId || rowId === userId) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return {
        success: false,
        message: "Mahasiswa tidak ditemukan"
      };
    }
    
    // Update status
    sheet.getRange(rowIndex, statusIndex + 1).setValue(newStatus);
    
    // Log perubahan
    console.log(`✅ Status mahasiswa ${userId} diubah menjadi ${newStatus}`);
    
    return {
      success: true,
      message: `Status berhasil diubah menjadi ${newStatus === 'active' ? 'aktif' : 'non-aktif'}`
    };
    
  } catch (error) {
    console.error("Error in updateStudentStatus:", error);
    return {
      success: false,
      message: "Terjadi kesalahan: " + error.toString()
    };
  }
}

// Student registration
function registerStudent(formData) {
  try {
    console.log("=== registerStudent START ===");
    console.log("Form data:", JSON.stringify(formData, null, 2));
    
    var sheet = getSheet("students_profiles");
    if (!sheet) {
      return {
        success: false,
        message: "Sheet data mahasiswa tidak ditemukan"
      };
    }
    
    // Generate user_id otomatis
    var newUserId = "STU" + Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMddHHmmss");
    
    // Siapkan data untuk dimasukkan
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    
    // Buat array untuk row baru
    var newRow = [];
    
    // Untuk setiap kolom di header, isi dengan data yang sesuai
    for (var i = 0; i < headers.length; i++) {
      var header = headers[i];
      var value = "";
      
      switch(header) {
        case "user_id":
        case "id":
          value = newUserId;
          break;
        case "fullname":
        case "nama":
        case "name":
          value = formData.fullname || "";
          break;
        case "nim":
        case "student_id":
          value = formData.nim || "";
          break;
        case "email":
        case "email_address":
          value = formData.email || "";
          break;
        case "phone":
        case "telepon":
        case "phone_number":
          value = formData.phone || "";
          break;
        case "faculty":
        case "fakultas":
          value = formData.faculty || "";
          break;
        case "program":
        case "program_studi":
        case "prodi":
          value = formData.program || "";
          break;
        case "year":
        case "tahun":
        case "angkatan":
          value = formData.year || "";
          break;
        case "emergency_contact":
        case "kontak_darurat":
          value = formData.emergency_contact || "";
          break;
        case "status":
        case "status_mahasiswa":
          value = formData.status || "active";
          break;
        case "risk_level":
        case "tingkat_risiko":
          value = formData.risk_level || "low";
          break;
        case "notes":
        case "catatan":
          value = formData.notes || "";
          break;
        case "registered_date":
        case "tanggal_daftar":
          value = new Date();
          break;
        case "created_at":
          value = new Date();
          break;
        default:
          value = "";
      }
      
      newRow.push(value);
    }
    
    // Tambah row baru
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, 1, newRow.length).setValues([newRow]);
    
    console.log("✅ Mahasiswa baru berhasil ditambahkan dengan ID:", newUserId);
    console.log("Row data:", newRow);
    
    // Juga tambah ke sheet users untuk login
    createStudentUserAccount(newUserId, formData);
    
    return {
      success: true,
      message: "Mahasiswa baru berhasil ditambahkan",
      userId: newUserId
    };
    
  } catch (error) {
    console.error("Error in registerStudent:", error);
    return {
      success: false,
      message: "Terjadi kesalahan: " + error.toString()
    };
  }
}

// Create student user account
function createStudentUserAccount(userId, formData) {
  try {
    var userSheet = getSheet("users");
    if (!userSheet) {
      console.log("⚠️ Sheet users tidak ditemukan, akun login tidak dibuat");
      return;
    }
    
    var newUserRow = [
      userId,                    // user_id
      formData.email || "",      // username/email
      "Mahasiswa@123",           // password default
      formData.fullname || "",   // fullname
      "student",                 // role
      formData.email || "",      // email
      formData.phone || "",      // phone
      "active",                  // status
      new Date(),                // created_at
      "",                        // last_login
      "Dibuat otomatis dari sistem"  // notes
    ];
    
    var lastRow = userSheet.getLastRow();
    userSheet.getRange(lastRow + 1, 1, 1, newUserRow.length).setValues([newUserRow]);
    
    console.log("✅ Akun login untuk mahasiswa dibuat di sheet users");
    
  } catch (error) {
    console.error("⚠️ Gagal membuat akun login:", error);
  }
}

// Export students data
function exportStudentsData() {
  try {
    var sheet = getSheet("students_profiles");
    if (!sheet) {
      return "Sheet data mahasiswa tidak ditemukan";
    }
    
    var data = sheet.getDataRange().getValues();
    
    // Konversi ke CSV format
    var csvContent = "";
    
    // Header
    var headers = data[0];
    csvContent += headers.join(",") + "\n";
    
    // Data rows
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      
      // Escape commas and quotes in cells
      var escapedRow = row.map(function(cell) {
        if (cell === null || cell === undefined) return "";
        var cellStr = String(cell);
        if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
          return '"' + cellStr.replace(/"/g, '""') + '"';
        }
        return cellStr;
      });
      
      csvContent += escapedRow.join(",") + "\n";
    }
    
    console.log("✅ Data exported successfully");
    return csvContent;
    
  } catch (error) {
    console.error("Error in exportStudentsData:", error);
    return "Terjadi kesalahan: " + error.toString();
  }
}

// Get student by NIM
function getStudentByNIM(nim) {
  var students = getAllStudents();
  return students.find(function(student) {
    return student.nim === nim;
  });
}

// Emergency function
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