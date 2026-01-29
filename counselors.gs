// ===============================
// COUNSELORS MANAGEMENT FUNCTIONS
// ===============================

// ========== DASHBOARD FUNCTIONS - VERSION 2.0 ==========
// Ditambahkan dari counselor_dash_functions.gs

// ========== CONFIGURATION ==========
const CONFIG = {
  SPREADSHEET_ID: '1Qh-rqITpClruPeCRfQfzvThngpY6RpKyaKR9T7VfJag',
  SHEETS: {
    SESSIONS: 'counseling_sessions',
    PROFILES: 'counselors_profiles',
    STUDENTS: 'students_profiles',
    ASSESSMENTS: 'assessments',
    NOTIFICATIONS: 'notifications'
  }
};

// ========== CORE UTILITY FUNCTIONS ==========

function getSpreadsheet() {
  try {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  } catch (error) {
    console.error('❌ Cannot open spreadsheet: ' + error);
    return null;
  }
}

function getSheetByName(sheetName) {
  try {
    const ss = getSpreadsheet();
    if (!ss) return null;
    
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      console.error('❌ Sheet "' + sheetName + '" not found');
      return null;
    }
    
    return sheet;
  } catch (error) {
    console.error('❌ Error getting sheet: ' + error);
    return null;
  }
}

function normalizeId(id) {
  if (id === null || id === undefined) return null;
  
  // Convert to number if possible
  const numId = Number(id);
  if (!isNaN(numId)) {
    return numId;
  }
  
  // Return as string
  return String(id).trim();
}

function idsMatch(id1, id2) {
  const norm1 = normalizeId(id1);
  const norm2 = normalizeId(id2);
  
  if (norm1 === null || norm2 === null) return false;
  
  // Try numeric comparison
  if (typeof norm1 === 'number' && typeof norm2 === 'number') {
    return norm1 === norm2;
  }
  
  // Try string comparison
  if (String(norm1) === String(norm2)) return true;
  
  // Try loose comparison
  return norm1 == norm2;
}

function parseDateRobust(dateValue) {
  if (!dateValue) return null;
  
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : dateValue;
  }
  
  try {
    const str = String(dateValue).trim();
    
    // Coba parsing sebagai Date object biasa
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
    
    // Format: "1/23/2026 10:15:30"
    if (str.includes('/')) {
      const parts = str.split(' ');
      const datePart = parts[0];
      const timePart = parts[1] || '00:00:00';
      
      const dateParts = datePart.split('/');
      const month = parseInt(dateParts[0]);
      const day = parseInt(dateParts[1]);
      const year = parseInt(dateParts[2]);
      
      const timeParts = timePart.split(':');
      const hours = parseInt(timeParts[0]) || 0;
      const minutes = parseInt(timeParts[1]) || 0;
      const seconds = parseInt(timeParts[2]) || 0;
      
      const date = new Date(year, month - 1, day, hours, minutes, seconds);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Coba format lain
    if (str.includes('-')) {
      const parts = str.split(' ');
      const datePart = parts[0];
      const timePart = parts[1] || '00:00:00';
      
      const dateParts = datePart.split('-');
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]);
      const day = parseInt(dateParts[2]);
      
      const timeParts = timePart.split(':');
      const hours = parseInt(timeParts[0]) || 0;
      const minutes = parseInt(timeParts[1]) || 0;
      const seconds = parseInt(timeParts[2]) || 0;
      
      const date = new Date(year, month - 1, day, hours, minutes, seconds);
      return isNaN(date.getTime()) ? null : date;
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Date parse error: ' + error);
    return null;
  }
}

function getColumnIndex(headers, possibleNames) {
  for (var i = 0; i < headers.length; i++) {
    var headerStr = String(headers[i]).toLowerCase().trim();
    for (var j = 0; j < possibleNames.length; j++) {
      if (headerStr === possibleNames[j].toLowerCase()) {
        return i;
      }
    }
  }
  return -1;
}

// Helper function untuk mendapatkan huruf kolom
function getColumnLetter(column) {
  var temp, letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

// ========== NAVIGATION FUNCTIONS ==========

function getPageUrl(pageName) {
  try {
    // Untuk Google Apps Script Web App, URL dasar adalah:
    const scriptUrl = ScriptApp.getService().getUrl();
    console.log('🔗 Generating URL for page:', pageName);
    console.log('📌 Base script URL:', scriptUrl);
    
    // Mapping nama halaman ke parameter page
    const pageMap = {
      'DashboardCounselor': 'dashboard_counselor',
      'CounselorSchedule': 'counselor_schedule',
      'CounselorStudents': 'counselor_students',
      'CounselorAssessments': 'counselor_assessments',
      'CounselorVideoSessions': 'counselor_video',
      'CounselorProfile': 'counselor_profile'
    };
    
    const paramName = pageMap[pageName] || pageName.toLowerCase();
    const url = scriptUrl + '?page=' + paramName;
    
    console.log('✅ Generated URL:', url);
    return url;
  } catch (error) {
    console.error('❌ Error generating page URL:', error);
    // Fallback ke URL standar
    return ScriptApp.getService().getUrl() + '?page=' + pageName;
  }
}

// ========== SESSION MANAGEMENT ==========

function getCounselorSessionData() {
  try {
    console.log('🔐 getCounselorSessionData START');
    
    var session = getSession();
    
    if (!session || !session.id) {
      console.log('⚠️ No valid session, using fallback');
      // Fallback untuk testing
      return {
        id: 5,
        username: 'dr_siti',
        fullname: 'Dr. Siti Nurhaliza, M.Psi',
        email: 'siti.nurhaliza@asakur.com',
        role: 'counselor'
      };
    }
    
    console.log('✅ Valid session: ' + session.username);
    return session;
    
  } catch (error) {
    console.error('❌ Error in getCounselorSessionData: ' + error);
    // Fallback untuk testing
    return {
      id: 5,
      username: 'dr_siti',
      fullname: 'Dr. Siti Nurhaliza, M.Psi',
      email: 'siti.nurhaliza@asakur.com',
      role: 'counselor'
    };
  }
}

// ========== COUNSELOR PROFILE BY ID - FUNGSI DIPERBAIKI ==========
// Nama function diubah untuk menghindari konflik dengan getCounselorProfile yang sudah ada

function getCounselorProfileById(userId) {
  try {
    console.log('👤 getCounselorProfileById: ' + userId);
    
    var targetId = normalizeId(userId);
    if (targetId === null) {
      console.error('❌ Invalid user ID');
      return null;
    }
    
    var sheet = getSheetByName(CONFIG.SHEETS.PROFILES);
    if (!sheet) {
      console.error('❌ Profiles sheet not found');
      return null;
    }
    
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      console.log('ℹ️ No data in profiles sheet');
      return null;
    }
    
    var headers = data[0];
    console.log('📋 Profile headers (first 15 columns):');
    for (var h = 0; h < Math.min(headers.length, 15); h++) {
      console.log(`  ${h}: "${headers[h]}"`);
    }
    
    // **DEBUG: Tampilkan semua header untuk analisis**
    console.log('🔍 All headers in profiles sheet:');
    headers.forEach((header, idx) => {
      console.log(`  Column ${idx} (${getColumnLetter(idx+1)}): "${header}"`);
    });
    
    // **PERBAIKAN: Gunakan indeks langsung untuk kolom H (7) dan M (12)**
    // Berdasarkan struktur spreadsheet, kolom:
    // A(0): counselor_id, B(1): username, C(2): password, D(3): fullname,
    // E(4): email, F(5): specialization, G(6): experience_years,
    // H(7): availability, I(8): bio, J(9): education, K(10): certifications,
    // L(11): languages, M(12): photo_url
    
    // **METODE 1: Coba dulu dengan nama kolom**
    var userIdIndex = getColumnIndex(headers, ['counselor_id', 'user_id', 'id']);
    var nameIndex = getColumnIndex(headers, ['fullname', 'name', 'nama', 'full_name']);
    var usernameIndex = getColumnIndex(headers, ['username', 'user_name']);
    var emailIndex = getColumnIndex(headers, ['email', 'email_address']);
    var availabilityIndex = getColumnIndex(headers, ['availability', 'status', 'available', 'ketersediaan']);
    var photoIndex = getColumnIndex(headers, ['photo_url', 'photo', 'profile_picture', 'profile_pic', 'foto']);
    
    // **METODE 2: Fallback ke indeks langsung jika tidak ditemukan**
    if (userIdIndex === -1) userIdIndex = 0; // Kolom A
    if (availabilityIndex === -1) availabilityIndex = 7; // Kolom H
    if (photoIndex === -1) photoIndex = 12; // Kolom M
    if (nameIndex === -1) nameIndex = 3; // Kolom D
    
    console.log('🎯 Using column indices:');
    console.log('  - user_id: column ' + userIdIndex + ' (A=' + getColumnLetter(userIdIndex+1) + ')');
    console.log('  - fullname: column ' + nameIndex + ' (D=' + getColumnLetter(nameIndex+1) + ')');
    console.log('  - availability: column ' + availabilityIndex + ' (H=' + getColumnLetter(availabilityIndex+1) + ')');
    console.log('  - photo_url: column ' + photoIndex + ' (M=' + getColumnLetter(photoIndex+1) + ')');
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var rowUserId = row[userIdIndex];
      
      if (idsMatch(rowUserId, targetId)) {
        console.log('✅ Profile found at row ' + (i + 1));
        
        // **AMBIL DATA DENGAN INDEKS LANGSUNG**
        var profile = {
          user_id: rowUserId,
          fullname: row[nameIndex] || null,
          username: row[usernameIndex] || null,
          email: row[emailIndex] || null,
          availability: row[availabilityIndex] || 'available',
          photo_url: row[photoIndex] || null
        };
        
        // **PERBAIKAN KRITIS: Normalisasi availability**
        if (profile.availability) {
          // Convert ke string dan lowercase
          var availStr = String(profile.availability).toLowerCase().trim();
          
          // Mapping berbagai kemungkinan nilai
          if (availStr === 'busy' || availStr === 'sibuk' || availStr === 'tidak tersedia') {
            profile.availability = 'busy';
          } else if (availStr === 'available' || availStr === 'tersedia' || availStr === 'bisa') {
            profile.availability = 'available';
          } else {
            // Default jika nilai tidak dikenal
            console.log('⚠️ Unknown availability value: "' + profile.availability + '", defaulting to available');
            profile.availability = 'available';
          }
        } else {
          profile.availability = 'available'; // Default jika kosong
        }
        
        // **DEBUG: Tampilkan nilai mentah dari kolom H**
        console.log('📊 Availability debug:');
        console.log('  - Raw value from column H: "' + row[availabilityIndex] + '"');
        console.log('  - Processed value: "' + profile.availability + '"');
        
        console.log('✅ Profile data:', {
          id: profile.user_id,
          name: profile.fullname,
          availability: profile.availability,
          hasPhoto: !!profile.photo_url,
          photoUrl: profile.photo_url
        });
        
        return profile;
      }
    }
    
    console.log('❌ Profile not found for ID:', targetId);
    return null;
    
  } catch (error) {
    console.error('❌ Error in getCounselorProfileById: ' + error);
    console.error('Stack trace: ' + error.stack);
    return null;
  }
}

// ========== UPCOMING SESSIONS ==========

function getCounselorUpcomingSessions(counselorId) {
  try {
    console.log('📅 ========== getCounselorUpcomingSessions START ==========');
    console.log('📥 Input counselorId: ' + counselorId);
    
    // STEP 1: Validate input
    var targetId = normalizeId(counselorId);
    if (targetId === null) {
      console.error('❌ Invalid counselor ID');
      return [];
    }
    console.log('🎯 Normalized ID: ' + targetId);
    
    // STEP 2: Get sheet
    var sheet = getSheetByName(CONFIG.SHEETS.SESSIONS);
    if (!sheet) {
      console.error('❌ Sessions sheet not found');
      return [];
    }
    console.log('✅ Sheet found');
    
    // STEP 3: Get data
    var data = sheet.getDataRange().getValues();
    console.log('📊 Total rows: ' + data.length);
    
    if (data.length < 2) {
      console.log('⚠️ No data rows');
      return [];
    }
    
    var headers = data[0];
    console.log('📋 Headers count: ' + headers.length);
    
    // STEP 4: Find column indices dengan lebih banyak opsi
    var idx = {
      counselorId: getColumnIndex(headers, ['counselor_id', 'counselorid', 'counselor']),
      sessionId: getColumnIndex(headers, ['session_id', 'sessionid', 'id']),
      studentId: getColumnIndex(headers, ['student_id', 'studentid', 'student']),
      date: getColumnIndex(headers, ['scheduled_date', 'date', 'session_date', 'tanggal']),
      status: getColumnIndex(headers, ['status', 'session_status']),
      type: getColumnIndex(headers, ['session_type', 'type', 'jenis_sesi']),
      link: getColumnIndex(headers, ['meeting_link', 'link', 'meeting', 'video_link']),
      notes: getColumnIndex(headers, ['notes', 'note', 'catatan'])
    };
    
    console.log('🔍 Column indices found:');
    for (var key in idx) {
      console.log('  - ' + key + ': ' + idx[key]);
    }
    
    if (idx.counselorId === -1) {
      console.error('❌ counselor_id column not found');
      return [];
    }
    
    if (idx.date === -1) {
      console.error('❌ date column not found');
      return [];
    }
    
    // STEP 5: Process rows
    var now = new Date();
    // Set ke awal hari ini (00:00) agar sesi hari ini tidak langsung hilang jika jamnya sudah lewat
    var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var upcomingSessions = [];
    var totalMatches = 0;
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var rowCounselorId = row[idx.counselorId];
      
      // Check if matches counselor
      if (!idsMatch(rowCounselorId, targetId)) {
        continue;
      }
      
      totalMatches++;
      
      // Get date
      var dateValue = idx.date !== -1 ? row[idx.date] : null;
      var sessionDate = parseDateRobust(dateValue);
      
      if (!sessionDate) {
        console.log('⚠️ Row ' + (i + 1) + ': Invalid date: ' + dateValue);
        continue;
      }
      
      // Check if future (including today)
      if (sessionDate < todayStart) {
        continue;
      }
      
      // Get status
      var status = idx.status !== -1 ? String(row[idx.status] || 'scheduled') : 'scheduled';
      status = status.toLowerCase().trim();
      
      // Filter out completed/cancelled sessions
      var hiddenStatus = ['completed', 'cancelled', 'selesai', 'batal', 'done', 'finished'];
      if (hiddenStatus.includes(status)) {
        continue;
      }
      
      // Get student info
      var studentId = idx.studentId !== -1 ? row[idx.studentId] : '';
      var studentInfo = getStudentInfo(studentId);
      
      // Build session object
      var session = {
        session_id: idx.sessionId !== -1 ? row[idx.sessionId] : 'SES' + (i + 1),
        student_id: studentId,
        student_name: studentInfo.name,
        student_nim: studentInfo.nim,
        counselor_id: rowCounselorId,
        scheduled_date: sessionDate.toISOString(), // Kirim sebagai ISO string untuk konsistensi
        session_type: idx.type !== -1 ? row[idx.type] : 'video_call',
        status: status,
        meeting_link: idx.link !== -1 ? row[idx.link] : '',
        notes: idx.notes !== -1 ? row[idx.notes] : ''
      };
      
      upcomingSessions.push(session);
    }
    
    console.log('📊 Processing complete:');
    console.log('  - Total rows checked: ' + (data.length - 1));
    console.log('  - Rows matching counselor: ' + totalMatches);
    console.log('  - Upcoming sessions: ' + upcomingSessions.length);
    
    // STEP 6: Sort by date (terdekat ke terjauh)
    upcomingSessions.sort(function(a, b) {
      var dateA = new Date(a.scheduled_date);
      var dateB = new Date(b.scheduled_date);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });
    
    // STEP 7: Limit results
    var limitedSessions = upcomingSessions.slice(0, 10);
    
    // STEP 8: Log samples
    if (limitedSessions.length > 0) {
      console.log('📝 Sample session:');
      console.log(JSON.stringify(limitedSessions[0]));
    }
    
    console.log('✅ Returning array with ' + limitedSessions.length + ' sessions');
    console.log('========== getCounselorUpcomingSessions END ==========');
    
    return limitedSessions;
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR in getCounselorUpcomingSessions:');
    console.error('Error: ' + error);
    console.error('Stack: ' + error.stack);
    return [];
  }
}

// ========== STUDENT INFO ==========

function getStudentInfo(studentId) {
  try {
    // Coba ambil dari sheet terlebih dahulu
    var sheet = getSheetByName(CONFIG.SHEETS.STUDENTS);
    if (sheet) {
      var data = sheet.getDataRange().getValues();
      if (data.length > 1) {
        var headers = data[0];
        var idIndex = getColumnIndex(headers, ['user_id', 'id', 'student_id']);
        var nameIndex = getColumnIndex(headers, ['fullname', 'name', 'nama']);
        var nimIndex = getColumnIndex(headers, ['nim', 'nomor_induk', 'student_nim']);
        
        if (idIndex !== -1) {
          for (var i = 1; i < data.length; i++) {
            var row = data[i];
            if (idsMatch(row[idIndex], studentId)) {
              return {
                name: nameIndex !== -1 ? row[nameIndex] : 'Mahasiswa',
                nim: nimIndex !== -1 ? row[nimIndex] : ''
              };
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error getting student info from sheet: ' + error);
  }
  
  // Fallback ke data statis
  var students = {
    '12': { name: 'Mahasiswa 01', nim: '1234567656' },
    '12.0': { name: 'Mahasiswa 01', nim: '1234567656' },
    12: { name: 'Mahasiswa 01', nim: '1234567656' },
    '8': { name: 'Siti Rahmawati', nim: '20230002' },
    '8.0': { name: 'Siti Rahmawati', nim: '20230002' },
    8: { name: 'Siti Rahmawati', nim: '20230002' },
    '9': { name: 'Ahmad Fauzi', nim: '20230003' },
    '9.0': { name: 'Ahmad Fauzi', nim: '20230003' },
    9: { name: 'Ahmad Fauzi', nim: '20230003' },
    '13': { name: 'Rudi Hartanto', nim: '928829219' },
    '13.0': { name: 'Rudi Hartanto', nim: '928829219' },
    13: { name: 'Rudi Hartanto', nim: '928829219' }
  };
  
  var key = String(studentId).trim();
  if (students[key]) {
    return students[key];
  }
  
  // Try numeric key
  var numKey = Number(studentId);
  if (!isNaN(numKey) && students[numKey]) {
    return students[numKey];
  }
  
  return { name: 'Mahasiswa', nim: '' };
}

// ========== DASHBOARD STATISTICS ==========

function getCounselorDashboardStats(counselorId) {
  try {
    console.log('📊 getCounselorDashboardStats: ' + counselorId);
    
    var targetId = normalizeId(counselorId);
    if (targetId === null) {
      console.error('❌ Invalid counselor ID');
      return getEmptyStats();
    }
    
    var sheet = getSheetByName(CONFIG.SHEETS.SESSIONS);
    if (!sheet) return getEmptyStats();
    
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return getEmptyStats();
    
    var headers = data[0];
    var counselorIdIndex = getColumnIndex(headers, ['counselor_id']);
    var dateIndex = getColumnIndex(headers, ['scheduled_date', 'date']);
    var statusIndex = getColumnIndex(headers, ['status']);
    var studentIdIndex = getColumnIndex(headers, ['student_id']);
    
    if (counselorIdIndex === -1) return getEmptyStats();
    
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    var sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    var firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    var todaySessions = [];
    var weekSessions = [];
    var allStudents = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var rowCounselorId = row[counselorIdIndex];
      
      if (idsMatch(rowCounselorId, targetId)) {
        var dateValue = dateIndex !== -1 ? row[dateIndex] : null;
        var sessionDate = parseDateRobust(dateValue);
        var status = statusIndex !== -1 ? String(row[statusIndex] || 'scheduled').toLowerCase() : 'scheduled';
        var studentId = studentIdIndex !== -1 ? row[studentIdIndex] : null;
        
        if (studentId) {
          allStudents.push(studentId);
        }
        
        if (sessionDate) {
          if (sessionDate >= today && sessionDate < tomorrow) {
            todaySessions.push({ status: status });
          }
          
          if (sessionDate >= sevenDaysAgo && sessionDate <= now) {
            weekSessions.push({ status: status, student_id: studentId });
          }
        }
      }
    }
    
    // Get assessments
    var assessmentsSheet = getSheetByName(CONFIG.SHEETS.ASSESSMENTS);
    var totalAssessments = 0;
    var monthlyAssessments = 0;
    
    if (assessmentsSheet) {
      var assessData = assessmentsSheet.getDataRange().getValues();
      if (assessData.length > 1) {
        var assessHeaders = assessData[0];
        var assessCounselorIndex = getColumnIndex(assessHeaders, ['counselor_id']);
        var assessDateIndex = getColumnIndex(assessHeaders, ['assessment_date', 'date', 'created_at']);
        
        if (assessCounselorIndex !== -1) {
          for (var i = 1; i < assessData.length; i++) {
            var row = assessData[i];
            if (idsMatch(row[assessCounselorIndex], targetId)) {
              totalAssessments++;
              
              if (assessDateIndex !== -1) {
                var assessDate = parseDateRobust(row[assessDateIndex]);
                if (assessDate && assessDate >= firstDayOfMonth) {
                  monthlyAssessments++;
                }
              }
            }
          }
        }
      }
    }
    
    // Calculate unique students
    var uniqueStudents = [];
    var activeStudents = [];
    
    for (var i = 0; i < allStudents.length; i++) {
      var studentId = allStudents[i];
      if (studentId && uniqueStudents.indexOf(studentId) === -1) {
        uniqueStudents.push(studentId);
      }
    }
    
    for (var i = 0; i < weekSessions.length; i++) {
      var studentId = weekSessions[i].student_id;
      if (studentId && activeStudents.indexOf(studentId) === -1) {
        activeStudents.push(studentId);
      }
    }
    
    var stats = {
      todaySessions: todaySessions.length,
      todayPending: todaySessions.filter(function(s) { 
        return s.status === 'pending' || s.status === 'scheduled' || s.status === 'confirmed'; 
      }).length,
      totalClients: uniqueStudents.length,
      activeClients: activeStudents.length,
      totalAssessments: totalAssessments,
      monthlyAssessments: monthlyAssessments,
      weekSessions: weekSessions.length,
      weekScheduled: weekSessions.filter(function(s) { 
        return s.status === 'scheduled' || s.status === 'pending' || s.status === 'confirmed'; 
      }).length,
      weekCompleted: weekSessions.filter(function(s) { 
        return s.status === 'completed'; 
      }).length,
      weekCancelled: weekSessions.filter(function(s) { 
        return s.status === 'cancelled'; 
      }).length
    };
    
    console.log('📊 Stats calculated: ' + JSON.stringify(stats));
    return stats;
    
  } catch (error) {
    console.error('❌ Error in getCounselorDashboardStats: ' + error);
    return getEmptyStats();
  }
}

function getEmptyStats() {
  return {
    todaySessions: 0,
    todayPending: 0,
    totalClients: 0,
    activeClients: 0,
    totalAssessments: 0,
    monthlyAssessments: 0,
    weekSessions: 0,
    weekScheduled: 0,
    weekCompleted: 0,
    weekCancelled: 0
  };
}

// ========== AVAILABILITY UPDATE - FUNGSI DIPERBAIKI ==========

function updateCounselorAvailabilityV2(userId, availability) {
  try {
    console.log('🔄 Updating availability: ' + userId + ' to ' + availability);
    
    // Validasi input
    const validAvailability = ['available', 'busy'];
    if (!validAvailability.includes(availability)) {
      console.error('❌ Invalid availability value:', availability);
      return { success: false, message: 'Nilai ketersediaan tidak valid' };
    }
    
    var ss = getSpreadsheet();
    if (!ss) {
      console.error('❌ Cannot open spreadsheet');
      return { success: false, message: 'Cannot open spreadsheet' };
    }
    
    var sheet = ss.getSheetByName(CONFIG.SHEETS.PROFILES);
    if (!sheet) {
      console.error('❌ Profiles sheet not found');
      return { success: false, message: 'Profiles sheet not found' };
    }
    
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    
    // Cari kolom dengan tepat - di sheet counselors_profiles, kolom H (indeks 7) adalah availability
    var userIdIndex = getColumnIndex(headers, ['counselor_id', 'user_id', 'id']);
    var availabilityIndex = getColumnIndex(headers, ['availability', 'status', 'available']);
    
    console.log('🔍 Column indices for availability update:');
    console.log('  - user_id: ' + userIdIndex);
    console.log('  - availability: ' + availabilityIndex);
    
    if (userIdIndex === -1) {
      console.error('❌ user_id column not found');
      return { success: false, message: 'user_id column not found' };
    }
    
    if (availabilityIndex === -1) {
      console.error('❌ availability column not found');
      // Fallback: coba kolom 7 (H) secara langsung
      availabilityIndex = 7;
      console.log('⚠️ Using fallback index 7 for availability');
    }
    
    var targetId = normalizeId(userId);
    var rowUpdated = false;
    
    for (var i = 1; i < data.length; i++) {
      if (idsMatch(data[i][userIdIndex], targetId)) {
        // Update cell
        var cell = sheet.getRange(i + 1, availabilityIndex + 1);
        cell.setValue(availability);
        
        console.log('✅ Availability updated at row ' + (i + 1) + ', column ' + (availabilityIndex + 1));
        rowUpdated = true;
        break;
      }
    }
    
    if (rowUpdated) {
      // Update cache session jika diperlukan
      var session = getSession();
      if (session && session.id && idsMatch(session.id, targetId)) {
        session.availability = availability;
      }
      
      return { success: true, message: 'Status ketersediaan berhasil diperbarui' };
    } else {
      console.error('❌ Counselor not found with ID:', targetId);
      return { success: false, message: 'Konselor tidak ditemukan' };
    }
    
  } catch (error) {
    console.error('❌ Error updating availability: ' + error);
    console.error('Stack trace: ' + error.stack);
    return { success: false, message: error.toString() };
  }
}

// ========== NOTIFICATIONS ==========

function getMyNotifications() {
  try {
    var session = getSession();
    if (!session || !session.id) return [];
    
    var sheet = getSheetByName(CONFIG.SHEETS.NOTIFICATIONS);
    if (!sheet) return [];
    
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];
    
    var headers = data[0];
    var userIdIndex = getColumnIndex(headers, ['user_id', 'userid']);
    
    if (userIdIndex === -1) return [];
    
    var notifications = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (idsMatch(row[userIdIndex], session.id)) {
        var notification = {};
        for (var j = 0; j < headers.length; j++) {
          notification[headers[j]] = row[j];
        }
        notifications.push(notification);
      }
    }
    
    return notifications.slice(0, 10);
    
  } catch (error) {
    console.error('❌ Error in getMyNotifications: ' + error);
    return [];
  }
}

// ========== COMPATIBILITY FUNCTIONS ==========

function getDashboardStats(role) {
  var session = getCounselorSessionData();
  if (!session || !session.id) return getEmptyStats();
  
  if (role === 'counselor') {
    return getCounselorDashboardStats(session.id);
  }
  
  return getEmptyStats();
}

function getSessionWithDebug() {
  return getCounselorSessionData();
}

// ========== SESSION MANAGEMENT ==========

function clearSessionCache() {
  // Clear any session cache if needed
  CacheService.getUserCache().remove('current_session');
  CacheService.getScriptCache().remove('user_session');
}

// ========== ORIGINAL COUNSELORS.GS FUNCTIONS BELOW ==========

// Get all counselors
function getAllCounselors() {
  Logger.log("=== getAllCounselors START ===");
  
  var emptyResult = [];
  
  try {
    var ss;
    try {
      //ss = SpreadsheetApp.openById("1s0xcQAQZSvISy4F1EQ-TJkVdQPFxv33B-MR0z3kYgS8");
      ss = SpreadsheetApp.getActiveSpreadsheet();
      Logger.log("✅ Spreadsheet opened by ID");
    } catch (idError) {
      Logger.log("❌ Failed by ID, trying active: " + idError);
      ss = SpreadsheetApp.getActiveSpreadsheet();
      Logger.log("✅ Using active spreadsheet");
    }
    
    if (!ss) {
      Logger.log("❌ Spreadsheet is null");
      return emptyResult;
    }
    
    Logger.log("Spreadsheet name: " + ss.getName());
    
    var sheet = ss.getSheetByName("counselors_profiles");
    if (!sheet) {
      Logger.log("❌ Sheet counselors_profiles not found");
      return emptyResult;
    }
    
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    
    Logger.log("Sheet dimensions: " + lastRow + " rows, " + lastCol + " cols");
    
    if (lastRow <= 1) {
      Logger.log("ℹ️ Sheet has only headers, no data");
      return emptyResult;
    }
    
    var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    Logger.log("Data array size: " + data.length + " x " + data[0].length);
    
    var result = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      
      if (!row[0] && !row[1]) continue;
      
      // GET PHOTO_URL DENGAN PENANGANAN KHUSUS
      var photoUrl = "";
      if (row[12]) {
        photoUrl = String(row[12]).trim();
        
        // Transform semua format Google Drive URL ke direct link
        photoUrl = convertToDirectImageUrl(photoUrl);
        Logger.log("Transformed photo URL: " + photoUrl);
      }
      
      var counselor = {
        user_id: String(row[0] || "").trim(),
        name: String(row[1] || "").trim(),
        email: String(row[2] || "").trim(),
        phone: String(row[3] || "").trim(),
        specialization: String(row[4] || "Umum").trim(),
        bio: String(row[5] || "").trim(),
        status: String(row[6] || "pending").toLowerCase().trim(),
        availability: String(row[7] || "available").trim(),
        experience: String(row[9] || "0").trim(),
        education: String(row[10] || "").trim(),
        certifications: String(row[11] || "").trim(),
        photo_url: photoUrl
      };
      
      if (counselor.user_id || counselor.name) {
        result.push(counselor);
        Logger.log("Added counselor: " + counselor.name + " | Photo URL: " + photoUrl);
      }
    }
    
    Logger.log("Processed " + result.length + " counselors");
    
    if (result.length > 0) {
      Logger.log("Sample counselor photo_url: " + result[0].photo_url);
    }
    
    return result || emptyResult;
    
  } catch (error) {
    Logger.log("❌❌❌ FATAL ERROR: " + error.toString());
    Logger.log("Stack: " + error.stack);
    return emptyResult;
  }
}

// Get individual counselor profile
function getCounselorProfile(userId) {
  try {
    var sheet = getSheet("counselors_profiles");
    if (!sheet) return null;
    
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      
      if (String(row[0]) === String(userId)) {
        var registeredDate = "";
        try {
          if (row[8]) {
            registeredDate = String(row[8]);
          }
        } catch (dateError) {
          console.log(`⚠️ Date error for ${row[0]}: ${dateError.message}`);
          registeredDate = "";
        }
        
        return {
          user_id: row[0],
          fullname: row[1] || '',
          email: row[2] || '',
          phone: row[3] || '',
          specialization: row[4] || '',
          bio: row[5] || '',
          status: row[6] || '',
          availability: row[7] || '',
          created_at: registeredDate,
          experience: row[9] || '',
          education: row[10] || '',
          certifications: row[11] || '',
          photo_url: row[12] || ''
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error in getCounselorProfile:", error);
    return null;
  }
}

// Get available counselors (approved and available)
function getAvailableCounselors() {
  var counselors = getAllCounselors();
  return counselors.filter(function(counselor) {
    return counselor.status === "approved" && counselor.availability === "available";
  });
}

// Update counselor status
function updateCounselorStatus(userId, newStatus) {
  var sheet = getSheet("counselors_profiles");
  if (!sheet) {
    return { success: false, message: "Sheet counselors_profiles tidak ditemukan." };
  }

  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[0]) === String(userId)) {
      // Status ada di kolom 7 (index 6)
      sheet.getRange(i + 1, 7).setValue(newStatus);
      
      // Update users sheet as well
      updateUserStatus(userId, newStatus);
      
      return { success: true };
    }
  }

  return { success: false, message: "Konselor tidak ditemukan." };
}

// Update counselor data (with photo handling)
function updateCounselorData(formData) {
  try {
    console.log("=== updateCounselorData START ===");
    console.log("FormData:", formData);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const counselorsSheet = ss.getSheetByName('counselors_profiles');
    
    if (!counselorsSheet) {
      console.error("❌ Sheet counselors_profiles tidak ditemukan");
      return { success: false, message: 'Sheet Konselor tidak ditemukan' };
    }
    
    const data = counselorsSheet.getDataRange().getValues();
    const headers = data[0];
    
    console.log("Headers:", headers);
    console.log("Total rows:", data.length);
    
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      console.log(`Row ${i}: user_id=${data[i][0]}, mencari=${formData.user_id}`);
      if (String(data[i][0]) === String(formData.user_id)) {
        rowIndex = i + 1;
        console.log("✅ Found at row:", rowIndex);
        break;
      }
    }
    
    if (rowIndex === -1) {
      console.error("❌ Konselor tidak ditemukan dengan user_id:", formData.user_id);
      return { success: false, message: 'Konselor tidak ditemukan. ID: ' + formData.user_id };
    }
    
    // Handle photo upload jika ada base64 image
    let photoUrl = formData.photo_url || '';
    
    if (formData.photo_url && formData.photo_url.startsWith('data:image')) {
      try {
        console.log("📸 Processing photo upload...");
        const base64Data = formData.photo_url.split(',')[1];
        const blob = Utilities.newBlob(
          Utilities.base64Decode(base64Data), 
          'image/jpeg', 
          'profile_' + formData.user_id + '_' + new Date().getTime() + '.jpg'
        );
        
        const storageFolder = getPhotoStorageFolder();
        console.log("📁 Using storage folder:", storageFolder.getName(), "ID:", storageFolder.getId());
        
        cleanupOldPhotos(formData.user_id, storageFolder);
        
        const file = storageFolder.createFile(blob);
        
        // SET PERMISSION YANG BENAR
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        // Tunggu sebentar untuk permission diterapkan
        Utilities.sleep(1000);
        
        // Dapatkan URL yang bisa diakses publik (format direct)
        photoUrl = "https://drive.google.com/uc?id=" + file.getId() + "&export=view";
        
        console.log("✅ Photo uploaded to:", storageFolder.getName());
        console.log("   File ID:", file.getId());
        console.log("   Public URL:", photoUrl);
        
      } catch (e) {
        console.error('❌ Error uploading photo:', e);
        photoUrl = formData.photo_url || '';
      }
    } else if (formData.photo_url === '' || formData.photo_url === 'null' || formData.photo_url === 'undefined') {
      try {
        const storageFolder = getPhotoStorageFolder();
        cleanupOldPhotos(formData.user_id, storageFolder);
        photoUrl = '';
      } catch (e) {
        console.warn("⚠️ Cannot cleanup photos:", e);
      }
    } else if (formData.photo_url && formData.photo_url.includes("drive.google.com")) {
      // Konversi ke format direct jika sudah ada URL
      photoUrl = convertToDirectImageUrl(formData.photo_url);
    }
    
    console.log("📝 Updating spreadsheet data...");
    
    const updates = [
      { col: 2, value: formData.name || '' },
      { col: 3, value: formData.email || '' },
      { col: 4, value: formData.phone || '' },
      { col: 5, value: formData.specialization || '' },
      { col: 6, value: formData.bio || '' },
      { col: 7, value: formData.status || 'pending' },
      { col: 8, value: formData.availability || 'available' },
      { col: 10, value: formData.experience || 0 },
      { col: 11, value: formData.education || '' },
      { col: 12, value: formData.certifications || '' },
      { col: 13, value: photoUrl } // Simpan URL yang sudah dikonversi
    ];
    
    updates.forEach(update => {
      counselorsSheet.getRange(rowIndex, update.col).setValue(update.value);
      console.log(`Updated column ${update.col}: ${update.value}`);
    });
    
    try {
      const timestampCol = 14;
      counselorsSheet.getRange(rowIndex, timestampCol).setValue(new Date());
    } catch (e) {
      console.log("No updated_at column");
    }
    
    console.log("✅ Data konselor berhasil diperbarui");
    
    return { 
      success: true, 
      message: 'Data konselor berhasil diperbarui',
      photo_url: photoUrl
    };
    
  } catch (error) {
    console.error('❌ Error updating counselor:', error);
    return { success: false, message: 'Terjadi kesalahan: ' + error.toString() };
  }
}

// Update counselor availability
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

// Get counselor sessions
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

// Export counselors data
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

// Counselor registration
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
        "experience", "education", "certifications"
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
      data.experience || 0,
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