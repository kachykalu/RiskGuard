function onEdit(e) {
  var sheet = e.source.getActiveSheet();
  var range = e.range;
  var editedRow = range.getRow();
  var editedColumn = range.getColumn();
  
  if (editedRow < 3) return;  // Ensure all automations start from row 3
  
  var statusColumn = 12; // Column L (Status)
  var dateClosedColumn = 16; // Column P (Date Closed in Risk Register)
  var indexSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Index');
  
  // Log changes from Column A to Column Q (columns 1-17)
  var trackedColumns = Array.from({ length: 17 }, (_, i) => i + 1); // Columns A-Q (1 to 17)
  
  // If the edit happened in the tracked columns, log the change
  if (trackedColumns.includes(editedColumn)) {
    var currentDateTime = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MM/dd/yyyy, hh:mm:ss a");
    var userName = Session.getActiveUser().getEmail().split('@')[0];
    var changeMessage = `${currentDateTime} changed by ${userName}`;
    
    indexSheet.getRange(editedRow, 2).setValue(changeMessage); // Log to Column 2 in 'Index'
    sheet.getRange(editedRow, 18).setValue(changeMessage); // Sync with Column R in 'Risk Register'
  }
  
  // Handle status changes (Closed/Open)
  if (editedColumn === statusColumn) {
    var statusValue = sheet.getRange(editedRow, statusColumn).getValue().toLowerCase();
    
    if (statusValue === 'closed') {
      var currentDateTime = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MM/dd/yyyy, hh:mm:ss a");
      indexSheet.getRange(editedRow, 1).setValue(currentDateTime); // Store in 'Index' Column 1
      sheet.getRange(editedRow, dateClosedColumn).setValue(currentDateTime); // Store in 'Risk Register' Column P
    } else {
      sheet.getRange(editedRow, dateClosedColumn).clearContent(); // Clear 'Risk Register' Column P
      indexSheet.getRange(editedRow, 1).clearContent(); // Clear 'Index' Column 1
    }
  }

}

// Function to update risk data when the sheet is opened
function onOpen() {
  updateRiskData();
}

// Function to update risk data dynamically
function updateRiskData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var indexSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Index');
  var data = sheet.getDataRange().getValues();
  var currentDate = new Date();
  
  for (var i = 2; i < data.length; i++) { // Start from row 3 (index 2 in array)
    var riskLevel = data[i][6]; // Column I (Risk Level)
    var riskDate = data[i][1];  // Column B (Risk Date)
    var status = data[i][11];   // Column L (Status)
    
    var dueDate = new Date(riskDate);
    var monthsToAdd = { "very high": 6, "high": 12, "medium": 24 }[riskLevel.toLowerCase()] || 0;
    
    var remainingDaysCell = sheet.getRange(i + 1, 14); // Column N (Remaining Days)
    
    if (riskLevel.toLowerCase() === "select option") {
      remainingDaysCell.clearContent().setBackground("#FFFFFF");
      continue;
    }
    
    if (status.toLowerCase() === "closed") {
      remainingDaysCell.setValue("Risk Closed").setBackground("#2EFF00");
      continue;
    }
    
    if (monthsToAdd) {
      dueDate.setMonth(dueDate.getMonth() + monthsToAdd);
      sheet.getRange(i + 1, 13).setValue(Utilities.formatDate(dueDate, Session.getScriptTimeZone(), "MM/dd/yyyy"));
      
      var daysRemaining = Math.floor((dueDate - currentDate) / (1000 * 3600 * 24));
      var countdownText = daysRemaining <= 0 ? "Due Now" : daysRemaining + " days remaining";
      if (daysRemaining === 1) countdownText = "1 day remaining";
      
      remainingDaysCell.setValue(countdownText)
        .setBackground(daysRemaining < 30 ? "#FF0000" : "#FFFFFF");
      
      var overdueDays = Math.max(0, Math.floor((currentDate - dueDate) / (1000 * 3600 * 24)));
      sheet.getRange(i + 1, 15).setValue(overdueDays > 0 ? overdueDays + " days" : "0 days");
    }
    
    // Restore Date Closed from Index sheet
    var storedDateClosed = indexSheet.getRange(i + 1, 1).getValue();
    if (storedDateClosed) {
      sheet.getRange(i + 1, 16).setValue(Utilities.formatDate(new Date(storedDateClosed), Session.getScriptTimeZone(), "MM/dd/yyyy, hh:mm:ss a"));
    } else {
      sheet.getRange(i + 1, 16).clearContent();
    }
  }
}
