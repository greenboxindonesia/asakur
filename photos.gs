// ===============================
// PHOTO MANAGEMENT FUNCTIONS
// ===============================

// Get photo storage folder
function getPhotoStorageFolder() {
  try {
    // Cek apakah ada setting khusus untuk folder ID
    const settingsSheet = getSheet("settings");
    let folderId = null;
    
    if (settingsSheet) {
      const data = settingsSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === "photo_storage_folder_id") {
          folderId = data[i][1];
          break;
        }
      }
    }
    
    // Jika ada setting folder ID, gunakan itu
    if (folderId) {
      try {
        return DriveApp.getFolderById(folderId);
      } catch (e) {
        console.warn("Folder ID dari setting tidak valid:", e.message);
      }
    }
    
    // Default: Gunakan folder dengan nama "ASAKUR_Counselor_Photos" di root
    const rootFolder = DriveApp.getRootFolder();
    const folderName = "ASAKUR_Counselor_Photos";
    
    // Cari folder yang sudah ada
    const folders = rootFolder.getFoldersByName(folderName);
    if (folders.hasNext()) {
      return folders.next();
    }
    
    // Buat folder baru
    console.log("📁 Creating new photo storage folder:", folderName);
    const newFolder = rootFolder.createFolder(folderName);
    
    // Set sharing permission (view untuk semua)
    newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Simpan folder ID ke settings untuk penggunaan berikutnya
    if (settingsSheet) {
      const folderSetting = ["photo_storage_folder_id", newFolder.getId(), "Folder untuk menyimpan foto profil konselor", new Date()];
      
      // Cek apakah setting sudah ada
      const data = settingsSheet.getDataRange().getValues();
      let settingExists = false;
      let existingRow = 0;
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === "photo_storage_folder_id") {
          settingExists = true;
          existingRow = i + 1;
          break;
        }
      }
      
      if (settingExists) {
        // Update existing setting
        settingsSheet.getRange(existingRow, 2).setValue(newFolder.getId());
        settingsSheet.getRange(existingRow, 4).setValue(new Date());
      } else {
        // Add new setting
        settingsSheet.appendRow(folderSetting);
      }
    }
    
    return newFolder;
    
  } catch (error) {
    console.error("❌ Error getting photo storage folder:", error);
    // Fallback ke root folder
    return DriveApp.getRootFolder();
  }
}

// Get photo storage info
function getPhotoStorageInfo() {
  try {
    const folder = getPhotoStorageFolder();
    return {
      success: true,
      folderName: folder.getName(),
      folderId: folder.getId(),
      folderUrl: folder.getUrl(),
      totalFiles: countFilesInFolder(folder)
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Count files in folder
function countFilesInFolder(folder) {
  let count = 0;
  const files = folder.getFiles();
  while (files.hasNext()) {
    files.next();
    count++;
  }
  return count;
}

// Cleanup old photos
function cleanupOldPhotos(userId, folder) {
  try {
    const fileNamePattern = `profile_${userId}`;
    const files = folder.getFiles();
    let deletedCount = 0;
    
    while (files.hasNext()) {
      const file = files.next();
      if (file.getName().startsWith(fileNamePattern)) {
        file.setTrashed(true);
        deletedCount++;
        console.log(`🗑️ Deleted old photo: ${file.getName()}`);
      }
    }
    
    return deletedCount;
  } catch (error) {
    console.error("Error cleaning up old photos:", error);
    return 0;
  }
}

// Change photo storage folder
function changePhotoStorageFolder(newFolderId) {
  try {
    // Validasi folder ID
    const newFolder = DriveApp.getFolderById(newFolderId);
    
    // Simpan ke settings
    const settingsSheet = getSheet("settings");
    if (!settingsSheet) {
      return { success: false, message: "Settings sheet tidak ditemukan" };
    }
    
    const data = settingsSheet.getDataRange().getValues();
    let settingExists = false;
    let existingRow = 0;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === "photo_storage_folder_id") {
        settingExists = true;
        existingRow = i + 1;
        break;
      }
    }
    
    const timestamp = new Date();
    
    if (settingExists) {
      // Update existing setting
      settingsSheet.getRange(existingRow, 2).setValue(newFolderId);
      settingsSheet.getRange(existingRow, 3).setValue("Folder untuk menyimpan foto profil konselor (diubah " + timestamp.toLocaleDateString("id-ID") + ")");
      settingsSheet.getRange(existingRow, 4).setValue(timestamp);
    } else {
      // Add new setting
      settingsSheet.appendRow(["photo_storage_folder_id", newFolderId, "Folder untuk menyimpan foto profil konselor", timestamp]);
    }
    
    return {
      success: true,
      message: "Folder penyimpanan foto berhasil diubah",
      folderInfo: {
        name: newFolder.getName(),
        id: newFolder.getId(),
        url: newFolder.getUrl()
      }
    };
    
  } catch (error) {
    console.error("Error changing photo storage folder:", error);
    return {
      success: false,
      message: "Folder ID tidak valid atau tidak dapat diakses: " + error.message
    };
  }
}

// Migrate photos to new folder
function migratePhotosToNewFolder(newFolderId) {
  try {
    const oldFolder = getPhotoStorageFolder();
    const newFolder = DriveApp.getFolderById(newFolderId);
    
    if (oldFolder.getId() === newFolderId) {
      return { success: false, message: "Folder lama dan baru sama" };
    }
    
    let migratedCount = 0;
    const files = oldFolder.getFiles();
    
    while (files.hasNext()) {
      const file = files.next();
      file.makeCopy(file.getName(), newFolder);
      migratedCount++;
    }
    
    return {
      success: true,
      message: `Berhasil memigrasi ${migratedCount} file ke folder baru`,
      migratedCount: migratedCount
    };
    
  } catch (error) {
    return {
      success: false,
      message: "Error migrasi: " + error.toString()
    };
  }
}

// Convert Google Drive URL to direct image URL
function convertToDirectImageUrl(url) {
  if (!url) return "";
  
  try {
    // Jika sudah format direct, return as is
    if (url.includes("uc?id=") || url.includes("uc?export=view")) {
      return url;
    }
    
    // Extract file ID dari berbagai format
    var fileId = "";
    
    // Format: /file/d/FILE_ID/view atau /preview
    var match1 = url.match(/\/d\/([^\/]+)/);
    if (match1) {
      fileId = match1[1];
    }
    
    // Format: /open?id=FILE_ID
    var match2 = url.match(/[?&]id=([^&]+)/);
    if (match2 && !fileId) {
      fileId = match2[1];
    }
    
    // Format: /file/d/FILE_ID
    var match3 = url.match(/\/file\/d\/([^\/?]+)/);
    if (match3 && !fileId) {
      fileId = match3[1];
    }
    
    if (fileId) {
      // Format direct URL untuk gambar
      return "https://drive.google.com/uc?id=" + fileId + "&export=view";
    }
    
    return url; // Return original jika tidak bisa dikonversi
  } catch (e) {
    console.error("Error converting URL:", e);
    return url;
  }
}

// Transform Drive URL
function transformDriveUrl(url) {
  try {
    // Jika URL sudah merupakan direct link, biarkan
    if (url.includes("uc?id=") || url.includes("file/d/")) {
      return url;
    }
    
    // Extract file ID dari berbagai format Google Drive URL
    var fileId = "";
    
    // Format: https://drive.google.com/file/d/FILE_ID/view
    var match1 = url.match(/\/d\/([^\/]+)/);
    if (match1) {
      fileId = match1[1];
    }
    
    // Format: https://drive.google.com/open?id=FILE_ID
    var match2 = url.match(/[?&]id=([^&]+)/);
    if (match2 && !fileId) {
      fileId = match2[1];
    }
    
    if (fileId) {
      // Return direct download URL
      return "https://drive.google.com/uc?id=" + fileId + "&export=view";
    }
    
    return url; // Return original jika tidak bisa ditransform
  } catch (e) {
    return url;
  }
}

// Get shareable image URL
function getShareableImageUrl(file) {
  try {
    // Dapatkan file ID
    const fileId = file.getId();
    
    // URL langsung untuk gambar (untuk img tag)
    const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
    
    // Juga buat URL thumbnail untuk loading lebih cepat
    const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
    
    console.log("🌐 Generated URLs:");
    console.log("   Direct URL:", directUrl);
    console.log("   Thumbnail URL:", thumbnailUrl);
    
    // Simpan URL langsung ke spreadsheet
    return directUrl;
    
  } catch (error) {
    console.error("❌ Error generating shareable URL:", error);
    return file.getUrl(); // Fallback ke URL biasa
  }
}

// Extract file ID from URL
function extractFileIdFromUrl(url) {
  try {
    // Format: https://drive.google.com/file/d/FILE_ID/view
    var match1 = url.match(/\/d\/([^\/]+)/);
    if (match1) {
      return match1[1];
    }
    
    // Format: https://drive.google.com/open?id=FILE_ID
    var match2 = url.match(/[?&]id=([^&]+)/);
    if (match2) {
      return match2[1];
    }
    
    // Format: https://drive.google.com/uc?id=FILE_ID
    var match3 = url.match(/uc\?id=([^&]+)/);
    if (match3) {
      return match3[1];
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

// Fix all photo permissions
function fixAllPhotoPermissions() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const counselorsSheet = ss.getSheetByName('counselors_profiles');
    
    if (!counselorsSheet) {
      return { success: false, message: 'Sheet tidak ditemukan' };
    }
    
    const data = counselorsSheet.getDataRange().getValues();
    const results = [];
    
    for (let i = 1; i < data.length; i++) {
      const photoUrl = data[i][12];
      
      if (photoUrl && photoUrl.includes("drive.google.com")) {
        try {
          const fileId = extractFileIdFromUrl(photoUrl);
          
          if (fileId) {
            const file = DriveApp.getFileById(fileId);
            
            // Set permission ke public
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            
            // Update URL ke format direct
            const newUrl = "https://drive.google.com/uc?id=" + fileId + "&export=view";
            counselorsSheet.getRange(i + 1, 13).setValue(newUrl);
            
            results.push({
              row: i + 1,
              name: data[i][1],
              fileId: fileId,
              oldUrl: photoUrl,
              newUrl: newUrl,
              status: 'fixed'
            });
            
            console.log(`Fixed permissions for: ${data[i][1]}`);
          }
        } catch (e) {
          results.push({
            row: i + 1,
            name: data[i][1],
            error: e.message,
            status: 'error'
          });
        }
      }
    }
    
    return {
      success: true,
      fixed: results.filter(r => r.status === 'fixed').length,
      errors: results.filter(r => r.status === 'error').length,
      results: results
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Test photo permissions
function testPhotoPermissions() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var counselorsSheet = ss.getSheetByName('counselors_profiles');
    
    if (!counselorsSheet) {
      return { success: false, message: 'Sheet not found' };
    }
    
    var data = counselorsSheet.getDataRange().getValues();
    var results = [];
    
    for (var i = 1; i < Math.min(6, data.length); i++) {
      var photoUrl = data[i][12];
      var fileId = extractFileIdFromUrl(photoUrl);
      
      var result = {
        row: i + 1,
        name: data[i][1],
        originalUrl: photoUrl,
        fileId: fileId,
        accessible: false
      };
      
      if (fileId) {
        try {
          var file = DriveApp.getFileById(fileId);
          var permissions = file.getSharingAccess();
          var permissionType = file.getSharingPermission();
          
          result.permissions = {
            access: permissions.toString(),
            type: permissionType.toString(),
            owners: file.getOwners().map(o => o.getEmail()),
            viewers: file.getViewers().map(v => v.getEmail())
          };
          
          result.accessible = (permissions === DriveApp.Access.ANYONE || 
                              permissions === DriveApp.Access.ANYONE_WITH_LINK);
          
          // Test URL
          result.testUrl = "https://drive.google.com/uc?id=" + fileId + "&export=view";
          
        } catch (e) {
          result.error = e.message;
        }
      }
      
      results.push(result);
    }
    
    return {
      success: true,
      results: results
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}