function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Student Directory')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getAllStudents() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Students');
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  return data.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      let value = row[index];
      if (header === 'Date of Birth' && value instanceof Date) {
        const year = value.getFullYear();
        const month = ('0' + (value.getMonth() + 1)).slice(-2);
        const day = ('0' + value.getDate()).slice(-2);
        value = `${year}-${month}-${day}`;
      }
      obj[header] = value;
    });
    return obj;
  });
}

function searchStudents(query, course) {
  const students = getAllStudents();
  let filteredStudents = students;
  const lowerQuery = query.toLowerCase();
  
  if (query.trim() !== '') {
    filteredStudents = filteredStudents.filter(student => 
      String(student['Student ID']).toLowerCase().includes(lowerQuery) ||
      student['Name'].toLowerCase().includes(lowerQuery) ||
      student["Father's Name"].toLowerCase().includes(lowerQuery) ||
      student['Course'].toLowerCase().includes(lowerQuery) ||
      student['City'].toLowerCase().includes(lowerQuery)
    );
  }
  
  if (course && course !== 'All') {
    filteredStudents = filteredStudents.filter(student => student['Course'] === course);
  }
  
  return filteredStudents;
}

function getUniqueCourses() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Students');
  const data = sheet.getRange('Students!E2:E').getValues();
  const courses = data.flat().filter(course => course !== '').map(course => course.trim());
  const uniqueCourses = [...new Set(courses)];
  return uniqueCourses;
}

function getStudentById(studentId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Students');
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  const studentRow = data.find(row => String(row[0]) === String(studentId));
  if (!studentRow) {
    return null;
  }
  
  let studentData = {};
  headers.forEach((header, index) => {
    let value = studentRow[index];
    if (header === 'Date of Birth' && value instanceof Date) {
      const year = value.getFullYear();
      const month = ('0' + (value.getMonth() + 1)).slice(-2);
      const day = ('0' + value.getDate()).slice(-2);
      value = `${year}-${month}-${day}`;
    }
    studentData[header] = value;
  });
  
  return studentData;
}

function getGradeData(studentId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Grades');
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  const gradeRow = data.find(row => String(row[0]) === String(studentId));
  if (!gradeRow) {
    return null;
  }
  
  let gradeData = {};
  headers.forEach((header, index) => {
    gradeData[header] = gradeRow[index];
  });
  
  return gradeData;
}

function verifyCredentials(username, password) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Passwords');
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  const userRow = data.find(row => String(row[0]).toLowerCase() === String(username).toLowerCase());
  if (!userRow) {
    return false;
  }
  
  const storedPassword = String(userRow[1]);
  return storedPassword === password;
}

function updateStudentData(studentId, updatedData, username, password) {
  const isValid = verifyCredentials(username, password);
  if (!isValid) {
    return 'Invalid username or password.';
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Students');
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  const rowIndex = data.findIndex(row => String(row[0]) === String(studentId));
  
  if (rowIndex === -1) {
    return 'Student ID not found.';
  }
  
  const sheetRow = rowIndex + 2;
  const changes = [];
  
  for (let key in updatedData) {
    if (updatedData.hasOwnProperty(key)) {
      const newValue = updatedData[key];
      const colIndex = headers.indexOf(key);
      if (colIndex !== -1) {
        const oldValue = data[rowIndex][colIndex];
        if (String(oldValue) !== String(newValue)) {
          sheet.getRange(sheetRow, colIndex + 1).setValue(newValue);
          changes.push({
            field: key,
            oldValue: oldValue,
            newValue: newValue
          });
        }
      }
    }
  }
  
  if (changes.length > 0) {
    logHistory(username, studentId, changes);
    return 'Student data updated successfully.';
  } else {
    return 'No changes detected.';
  }
}

function logHistory(username, studentId, changes) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('History');
  if (!sheet) {
    sheet = ss.insertSheet('History');
    sheet.appendRow(['Timestamp', 'User', 'Student ID', 'Field Changed', 'Old Value', 'New Value']);
  }
  
  const timestamp = new Date();
  
  changes.forEach(change => {
    sheet.appendRow([
      timestamp,
      username,
      studentId,
      change.field,
      change.oldValue,
      change.newValue
    ]);
  });
}
