// ===============================
// MAIN ROUTING FUNCTION
// ===============================
function doGet(e) {
  var page = e && e.parameter && e.parameter.page ? e.parameter.page : "";
  var session = getSession();

  console.log("Requested page:", page, "Session exists:", !!session);
  
  if (!page) {
    return HtmlService
      .createHtmlOutputFromFile("login")
      .setTitle("ASAKUR Login")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .setFaviconUrl('https://i.imgur.com/lCccyfK.png');
  }

  switch(page) {
    case "admin":
      if (!session || session.role !== "admin") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("dashboard_admin")
        .setTitle("Admin - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setFaviconUrl('https://i.imgur.com/lCccyfK.png');
    
    case "counselor":
      if (!session || session.role !== "counselor") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("dashboard_counselor")
        .setTitle("Konselor - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setFaviconUrl('https://i.imgur.com/lCccyfK.png');
    
    case "student":
      if (!session || session.role !== "student") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("dashboard_student")
        .setTitle("Mahasiswa - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setFaviconUrl('https://i.imgur.com/lCccyfK.png');
    
    case "register_student":
      return HtmlService
        .createHtmlOutputFromFile("register_student")
        .setTitle("Registrasi Mahasiswa - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setFaviconUrl('https://i.imgur.com/lCccyfK.png');
    
    case "register_counselor":
      return HtmlService
        .createHtmlOutputFromFile("register_counselor")
        .setTitle("Registrasi Konselor - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setFaviconUrl('https://i.imgur.com/lCccyfK.png');
    
    case "forgot_password":
      return HtmlService
        .createHtmlOutputFromFile("forgot_password")
        .setTitle("Lupa Password - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setFaviconUrl('https://i.imgur.com/lCccyfK.png');
    
    case "reset_password":
      if (!session) {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("reset_password")
        .setTitle("Reset Password - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setFaviconUrl('https://i.imgur.com/lCccyfK.png');
    
    // ===== ADMIN PAGES =====
    case "counselor_management":
      if (!session || session.role !== "admin") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("counselor_management")
        .setTitle("Manajemen Konselor - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setFaviconUrl('https://i.imgur.com/lCccyfK.png');
    
    case "student_management":
      if (!session || session.role !== "admin") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("student_management")
        .setTitle("Manajemen Mahasiswa - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setFaviconUrl('https://i.imgur.com/lCccyfK.png');
    
    case "appointment_schedule":
      if (!session || (session.role !== "admin" && session.role !== "counselor")) {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("appointment_schedule")
        .setTitle("Jadwal Konseling - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setFaviconUrl('https://i.imgur.com/lCccyfK.png');
    
    case "system_settings":
      if (!session || session.role !== "admin") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("system_settings")
        .setTitle("Pengaturan Sistem - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setFaviconUrl('https://i.imgur.com/lCccyfK.png');

    case "emergency_contacts":
      if (!session || session.role !== "admin") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("emergency_contacts")
        .setTitle("Kontak Darurat - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setFaviconUrl('https://i.imgur.com/lCccyfK.png');
    
    // ===== COUNSELOR PAGES =====
    case "counselor_schedule":
      if (!session || session.role !== "counselor") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("counselor_schedule")
        .setTitle("Jadwal Saya - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setFaviconUrl('https://i.imgur.com/lCccyfK.png');

    case "counselor_students":
      if (!session || session.role !== "counselor") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("counselor_students")
        .setTitle("Klien Saya - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setFaviconUrl('https://i.imgur.com/lCccyfK.png');

    case "counselor_assessments":
      if (!session || session.role !== "counselor") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("counselor_assessments")
        .setTitle("Asesmen - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setFaviconUrl('https://i.imgur.com/lCccyfK.png');

    case "counselor_video":
      if (!session || session.role !== "counselor") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("counselor_video")
        .setTitle("Sesi Virtual - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setFaviconUrl('https://i.imgur.com/lCccyfK.png');

    case "counselor_profile":
      if (!session || session.role !== "counselor") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("counselor_profile")
        .setTitle("Profil & Pengaturan - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setFaviconUrl('https://i.imgur.com/lCccyfK.png');

    // ===== STUDENT PAGES =====
    case "student_appointments":
      if (!session || session.role !== "student") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("student_appointments")
        .setTitle("Jadwal Konseling - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setFaviconUrl('https://i.imgur.com/lCccyfK.png');

    case "student_counselors":
      if (!session || session.role !== "student") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("student_counselors")
        .setTitle("Cari Konselor - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setFaviconUrl('https://i.imgur.com/lCccyfK.png');

    case "student_progress":
      if (!session || session.role !== "student") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("student_progress")
        .setTitle("Progress Saya - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setFaviconUrl('https://i.imgur.com/lCccyfK.png');

    case "student_profile":
      if (!session || session.role !== "student") {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("student_profile")
        .setTitle("Profil Saya - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setFaviconUrl('https://i.imgur.com/lCccyfK.png');

    // ===== OTHER PAGES =====
    case "assessment_form":
      if (!session || (session.role !== "counselor" && session.role !== "admin")) {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("assessment_form")
        .setTitle("Form Asesmen - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setFaviconUrl('https://i.imgur.com/lCccyfK.png');

    case "notification_center":
      if (!session) {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("notification_center")
        .setTitle("Notifikasi - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setFaviconUrl('https://i.imgur.com/lCccyfK.png');
    
    case "video_conference":
      if (!session || (session.role !== "counselor" && session.role !== "student")) {
        return redirectToLogin();
      }
      return HtmlService
        .createHtmlOutputFromFile("video_conference")
        .setTitle("Sesi Virtual - ASAKUR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setFaviconUrl('https://i.imgur.com/lCccyfK.png');
    
    default:
      return redirectToLogin();
  }
}

function redirectToLogin() {
  return HtmlService
    .createHtmlOutputFromFile("login")
    .setTitle("ASAKUR Login")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setFaviconUrl('https://i.imgur.com/lCccyfK.png');
}