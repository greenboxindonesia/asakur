// ===============================
// ASSESSMENTS MANAGEMENT FUNCTIONS
// ===============================

// Get student assessments by ID
function getStudentAssessmentsById(studentId) {
  try {
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
  } catch (error) {
    console.error("Error in getStudentAssessmentsById:", error);
    return [];
  }
}

// Get student assessments with filter
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

// Create assessment
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

// Calculate total score
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

// Get assessment trends
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

// Get risk level based on score
function getRiskLevel(totalScore) {
  if (totalScore >= 80) {
    return { level: "Rendah", color: "success", description: "Kondisi baik" };
  } else if (totalScore >= 60) {
    return { level: "Sedang", color: "warning", description: "Perlu perhatian" };
  } else {
    return { level: "Tinggi", color: "danger", description: "Perlu intervensi segera" };
  }
}

// Get all assessments
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