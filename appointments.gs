// ===============================
// APPOINTMENTS & SESSIONS MANAGEMENT
// ===============================

function getAllSessions() {
  console.log("=== START getAllSessions ===");
  
  try {
    // 1. Buka spreadsheet
    var ss = SpreadsheetApp.openById("1Qh-rqITpClruPeCRfQfzvThngpY6RpKyaKR9T7VfJag");
    console.log("Spreadsheet:", ss.getName());
    
    // 2. Dapatkan sheet sessions
    var sessionsSheet = ss.getSheetByName("counseling_sessions");
    if (!sessionsSheet) {
      console.log("❌ Sheet 'counseling_sessions' not found");
      return []; // Return empty array
    }
    
    console.log("✅ Sheet found:", sessionsSheet.getName());
    
    // 3. Ambil data
    var data = sessionsSheet.getDataRange().getValues();
    console.log("Data array size:", data.length, "rows x", data[0].length, "cols");
    
    if (data.length <= 1) {
      console.log("ℹ️ No data in sessions sheet");
      return [];
    }
    
    // 4. Process each row
    var result = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      
      // Skip empty rows
      if (!row[0] && !row[1] && !row[2]) {
        continue;
      }
      
      // Format date properly
      var scheduledDate = new Date();
      if (row[3]) {
        try {
          scheduledDate = new Date(row[3]);
          if (isNaN(scheduledDate.getTime())) {
            scheduledDate = new Date();
          }
        } catch (e) {
          scheduledDate = new Date();
        }
      }
      
      // Create session object
      var session = {
        session_id: String(row[0] || `SES${1000 + i}`).trim(),
        student_id: String(row[1] || '').trim(),
        counselor_id: String(row[2] || '').trim(),
        scheduled_date: scheduledDate.toISOString(),
        session_type: String(row[4] || 'video_call').toLowerCase(),
        status: String(row[5] || 'scheduled').toLowerCase(),
        meeting_link: String(row[6] || ''),
        notes: String(row[7] || ''),
        created_at: row[8] ? new Date(row[8]).toISOString() : new Date().toISOString(),
        student_name: `Mahasiswa ${row[1] || i}`,
        counselor_name: `Konselor ${row[2] || i}`
      };
      
      // Try to lookup real names
      try {
        var studentProfile = getStudentProfile(row[1]);
        if (studentProfile && studentProfile.fullname) {
          session.student_name = studentProfile.fullname;
        }
      } catch (e) {
        console.log(`Student lookup failed for ${row[1]}:`, e.message);
      }
      
      try {
        var counselorProfile = getCounselorProfile(row[2]);
        if (counselorProfile && counselorProfile.fullname) {
          session.counselor_name = counselorProfile.fullname;
        }
      } catch (e) {
        console.log(`Counselor lookup failed for ${row[2]}:`, e.message);
      }
      
      result.push(session);
      console.log(`✅ Session ${session.session_id}: ${session.student_name} with ${session.counselor_name}`);
    }
    
    console.log(`=== COMPLETED: Processed ${result.length} sessions ===`);
    
    return result; // Return array of sessions
    
  } catch (error) {
    console.error("❌ ERROR in getAllSessions:", error);
    console.error("Stack:", error.stack);
    
    return []; // Return empty array on error
  }
}

// ===============================
// FUNGSI CEK DATA SHEET (DARI CODE.GS LAMA)
// ===============================

function checkSessionsSheet() {
  console.log("=== checkSessionsSheet ===");
  
  try {
    var ss = SpreadsheetApp.openById("1Qh-rqITpClruPeCRfQfzvThngpY6RpKyaKR9T7VfJag");
    var sheet = ss.getSheetByName("counseling_sessions");
    
    if (!sheet) {
      return {
        success: false,
        error: "Sheet 'counseling_sessions' not found"
      };
    }
    
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    
    // Ambil semua data
    var data = sheet.getDataRange().getValues();
    
    // Ambil beberapa baris contoh
    var sampleRows = [];
    for (var i = 1; i < Math.min(4, data.length); i++) {
      sampleRows.push({
        row: i + 1,
        data: data[i]
      });
    }
    
    return {
      success: true,
      sheetName: sheet.getName(),
      dimensions: {
        rows: lastRow,
        cols: lastCol,
        dataRows: lastRow - 1
      },
      headers: data.length > 0 ? data[0] : [],
      sampleData: sampleRows,
      allData: data // Hati-hati jika data besar
    };
    
  } catch (error) {
    console.error("Error in checkSessionsSheet:", error);
    return {
      success: false,
      error: error.toString(),
      stack: error.stack
    };
  }
}

// Get student sessions by ID
function getStudentSessionsById(studentId) {
  try {
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
  } catch (error) {
    console.error("Error in getStudentSessionsById:", error);
    return [];
  }
}

// Get student sessions with filter
function getStudentSessions(filter) {
  try {
    var session = getSession();
    if (!session || session.role !== 'student') {
      return [];
    }
    
    var studentId = session.id;
    var sessions = getStudentSessionsById(studentId);
    
    // Apply filtering based on parameter
    if (filter && filter !== 'all') {
      var now = new Date();
      
      if (filter === 'current') {
        sessions = sessions.filter(function(s) {
          return new Date(s.scheduled_date) > now && s.status === 'scheduled';
        });
      } else if (filter === 'past') {
        sessions = sessions.filter(function(s) {
          return new Date(s.scheduled_date) < now || s.status === 'completed';
        });
      }
    }
    
    return sessions;
  } catch (error) {
    console.error("Error in getStudentSessions:", error);
    return [];
  }
}

// Create new session
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

// Update session status
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

// Generate meeting link
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

// Export sessions data
function exportSessionsData() {
  try {
    var sessions = getAllSessions();
    
    // Buat CSV content
    var csvContent = "ID Sesi,ID Mahasiswa,Nama Mahasiswa,ID Konselor,Nama Konselor,Tanggal,Tipe,Status,Link Meeting,Catatan\n";
    
    sessions.forEach(function(session) {
      var date = session.scheduled_date ? 
        new Date(session.scheduled_date).toLocaleDateString('id-ID') : '';
      
      var row = [
        session.session_id,
        session.student_id,
        session.student_name || '',
        session.counselor_id,
        session.counselor_name || '',
        date,
        session.session_type,
        session.status,
        session.meeting_link || '',
        session.notes || ''
      ].map(function(cell) {
        // Escape quotes and handle commas
        var cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return '"' + cellStr.replace(/"/g, '""') + '"';
        }
        return cellStr;
      }).join(',');
      
      csvContent += row + "\n";
    });
    
    console.log("✅ Data exported successfully");
    return csvContent;
    
  } catch (error) {
    console.error("Error in exportSessionsData:", error);
    return "Terjadi kesalahan: " + error.toString();
  }
}

// Appointment system initialization
function initializeAppointmentSystem() {
  console.log("=== INITIALIZING APPOINTMENT SYSTEM ===");
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Cek dan buat sheet counseling_sessions jika belum ada
    var sessionsSheet = ss.getSheetByName("counseling_sessions");
    if (!sessionsSheet) {
      console.log("⚠️ counseling_sessions sheet not found, creating...");
      sessionsSheet = createSheetIfNotExists("counseling_sessions", [
        "session_id", "student_id", "counselor_id", "scheduled_date",
        "session_type", "status", "meeting_link", "notes", "created_at"
      ]);
    }
    
    // 2. Ambil data untuk verifikasi
    var sessionsData = [];
    if (sessionsSheet.getLastRow() > 1) {
      var data = sessionsSheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        sessionsData.push({
          row: i + 1,
          id: data[i][0],
          student_id: data[i][1],
          counselor_id: data[i][2],
          status: data[i][5]
        });
      }
    }
    
    // 3. Return hasil
    return {
      success: true,
      message: "Appointment system initialized",
      sheets: {
        counseling_sessions: {
          exists: true,
          totalRows: sessionsSheet.getLastRow(),
          dataRows: sessionsSheet.getLastRow() - 1,
          sampleData: sessionsData.slice(0, 3)
        }
      }
    };
    
  } catch (error) {
    console.error("Error in initializeAppointmentSystem:", error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Create sample sessions data
function createSampleSessionsData() {
  try {
    var ss = SpreadsheetApp.openById("1s0xcQAQZSvISy4F1EQ-TJkVdQPFxv33B-MR0z3kYgS8");
    var sheet = ss.getSheetByName("counseling_sessions");
    
    if (!sheet) {
      // Buat sheet jika belum ada
      sheet = createSheetIfNotExists("counseling_sessions", [
        "session_id", "student_id", "counselor_id", "scheduled_date",
        "session_type", "status", "meeting_link", "notes", "created_at"
      ]);
    }
    
    // Jika sudah ada data, jangan buat lagi
    if (sheet.getLastRow() > 1) {
      return {
        success: false,
        message: "Data sudah ada, tidak dibuat sample"
      };
    }
    
    var sampleData = [
      {
        session_id: "SES001",
        student_id: "STU001",
        counselor_id: "COUN001",
        scheduled_date: new Date(new Date().getTime() + 86400000), // Besok
        session_type: "video_call",
        status: "scheduled",
        meeting_link: "https://meet.google.com/abc-def-ghi",
        notes: "Sesi konseling pertama untuk assessment"
      },
      {
        session_id: "SES002",
        student_id: "STU002",
        counselor_id: "COUN002",
        scheduled_date: new Date(new Date().getTime() + 172800000), // 2 hari lagi
        session_type: "in_person",
        status: "scheduled",
        meeting_link: "Ruang Konseling 301",
        notes: "Follow-up sesi sebelumnya"
      },
      {
        session_id: "SES003",
        student_id: "STU001",
        counselor_id: "COUN001",
        scheduled_date: new Date(new Date().getTime() - 86400000), // Kemarin
        session_type: "video_call",
        status: "completed",
        meeting_link: "https://meet.google.com/xyz-uvw-rst",
        notes: "Sesi berjalan dengan baik"
      }
    ];
    
    sampleData.forEach(function(session) {
      sheet.appendRow([
        session.session_id,
        session.student_id,
        session.counselor_id,
        session.scheduled_date,
        session.session_type,
        session.status,
        session.meeting_link,
        session.notes,
        new Date()
      ]);
    });
    
    console.log("✅ Sample sessions data created");
    
    return {
      success: true,
      created: sampleData.length,
      data: sampleData
    };
    
  } catch (error) {
    console.error("Error creating sample sessions:", error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Helper function untuk lookup student
function findStudentById(studentId) {
  try {
    var ss = SpreadsheetApp.openById("1s0xcQAQZSvISy4F1EQ-TJkVdQPFxv33B-MR0z3kYgS8");
    var sheet = ss.getSheetByName("students_profiles");
    
    if (!sheet) return null;
    
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      
      // Cek di kolom user_id (0) dan NIM (2)
      if ((row[0] && String(row[0]).trim() === studentId) ||
          (row[2] && String(row[2]).trim() === studentId)) {
        return {
          user_id: row[0] || '',
          fullname: row[1] || '',
          nim: row[2] || '',
          email: row[3] || '',
          phone: row[4] || '',
          found: true,
          row: i + 1
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error in findStudentById:", error);
    return null;
  }
}

// Helper function untuk lookup counselor
function findCounselorById(counselorId) {
  try {
    var ss = SpreadsheetApp.openById("1s0xcQAQZSvISy4F1EQ-TJkVdQPFxv33B-MR0z3kYgS8");
    var sheet = ss.getSheetByName("counselors_profiles");
    
    if (!sheet) return null;
    
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      
      if (row[0] && String(row[0]).trim() === counselorId) {
        return {
          user_id: row[0] || '',
          fullname: row[1] || '',
          email: row[2] || '',
          phone: row[3] || '',
          specialization: row[4] || '',
          bio: row[5] || '',
          status: row[6] || '',
          found: true,
          row: i + 1
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error in findCounselorById:", error);
    return null;
  }
}