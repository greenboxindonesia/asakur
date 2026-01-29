// ===============================
// CONFIGURATION & URL MANAGEMENT
// ===============================

// Base URL configuration
function getWebAppUrl() {
  return getBaseUrl();
}

function getBaseUrl() {
  try {
    var url = ScriptApp.getService().getUrl();
    
    // Ensure URL uses /exec
    if (url.includes('/dev')) {
      url = url.replace('/dev', '/exec');
    }
    
    // Remove query parameters and trailing slash
    url = url.split('?')[0].replace(/\/$/, '');
    
    // Ensure ends with /exec
    if (!url.endsWith('/exec')) {
      url += '/exec';
    }
    
    return url;
    
  } catch (e) {
    console.error("Error in getBaseUrl:", e);
    
    // Fallback: construct URL from Script ID
    try {
      var scriptId = ScriptApp.getScriptId();
      return 'https://script.google.com/macros/s/' + scriptId + '/exec';
    } catch (e2) {
      console.error("Fallback also failed:", e2);
      return 'https://script.google.com';
    }
  }
}

// URL builder functions
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

function getPageUrl(page) {
  var baseUrl = getBaseUrl();
  if (page && page !== '') {
    return baseUrl + '?page=' + page;
  }
  return baseUrl;
}

function getSimpleBaseUrl() {
  return getBaseUrl();
}

// URL testing function
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