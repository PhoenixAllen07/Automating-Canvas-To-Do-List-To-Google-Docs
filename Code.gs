// ======== CONFIG ========
const CANVAS_BASE_URL = "https://your-school.instructure.com";
const CANVAS_TOKEN = "PASTE_YOUR_CANVAS_TOKEN_HERE";
const COURSE_IDS = ["12345", "67890"]; // Replace with your course IDs
const GOOGLE_DOC_ID = "PASTE_YOUR_GOOGLE_DOC_ID_HERE";
// ========================


function updateHomeworkDoc() {
  const doc = DocumentApp.openById(GOOGLE_DOC_ID);
  const body = doc.getBody();
  body.clear();
  
  let title = body.appendParagraph("Homework To-Do List");
title.setHeading(DocumentApp.ParagraphHeading.HEADING1);
title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  const today = new Date();
  today.setHours(0,0,0,0);

  const twoWeeks = new Date(today);
  twoWeeks.setDate(today.getDate() + 14);

  COURSE_IDS.forEach(courseId => {

    const courseName = getCourseName(courseId);
    const assignments = getAssignments(courseId);

    const filtered = assignments.filter(a => {

      if (!a.published) return false;

      const dueDate = getEffectiveDueDate(a);
      if (!dueDate) return false;

      dueDate.setHours(0,0,0,0);

      if (dueDate < today) return false;
      if (dueDate > twoWeeks) return false;

      const sub = a.submission || {};

      if (sub.submitted_at) return false;
      if (sub.graded_at) return false;
      if (sub.excused) return false;

      return true;
    });

    if (filtered.length === 0) return;

    filtered.sort((a, b) => {
      return getEffectiveDueDate(a) - getEffectiveDueDate(b);
    });

    let courseParagraph = body.appendParagraph("\n" + courseName);
let text = courseParagraph.editAsText();
text.setBold(0, courseName.length - 1, true);
text.setFontSize(0, courseName.length - 1, 15);

    filtered.forEach(a => {
      const due = getEffectiveDueDate(a).toLocaleDateString();
      body.appendParagraph(`• ${a.name}\n   Due: ${due}\n`);
    });

  });

  doc.saveAndClose();
}


function getAssignments(courseId) {
  const url = `${CANVAS_BASE_URL}/api/v1/courses/${courseId}/assignments?include[]=submission&include[]=all_dates&per_page=100`;

  const response = UrlFetchApp.fetch(url, {
    headers: { "Authorization": "Bearer " + CANVAS_TOKEN }
  });

  const assignments = JSON.parse(response.getContentText());

  assignments.forEach(a => {
    if (!a.submission) a.submission = {};
  });

  return assignments;
}


function getCourseName(courseId) {
  const url = `${CANVAS_BASE_URL}/api/v1/courses/${courseId}`;

  const response = UrlFetchApp.fetch(url, {
    headers: { "Authorization": "Bearer " + CANVAS_TOKEN }
  });

  const course = JSON.parse(response.getContentText());
  return course.name;
}


function getEffectiveDueDate(assignment) {
  if (assignment.due_at) {
    return new Date(assignment.due_at);
  }

  if (assignment.all_dates && assignment.all_dates.length > 0) {
    const dateObj = assignment.all_dates.find(d => d.due_at);
    if (dateObj) return new Date(dateObj.due_at);
  }

  return null;
}
