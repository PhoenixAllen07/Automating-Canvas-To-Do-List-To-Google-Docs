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
  
  // Remove document header if it exists
if (doc.getHeader()) {
  doc.getHeader().clear();
}

// Reduce top margin
doc.setMarginTop(36); // default is 72, this cuts it in half
  let title = body.appendParagraph("Homework To-Do List");
  title.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  const today = new Date();
  today.setHours(0,0,0,0);

  const twoWeeks = new Date(today);
  twoWeeks.setDate(today.getDate() + 14);

  let allAssignments = [];

  COURSE_IDS.forEach(courseId => {

    const courseName = getCourseName(courseId);
    const assignments = getAssignments(courseId);

    assignments.forEach(a => {

      if (!a.published) return;

      const dueDate = getEffectiveDueDate(a);
      if (!dueDate) return;

      dueDate.setHours(0,0,0,0);

      if (dueDate < today) return;
      if (dueDate > twoWeeks) return;

      const sub = a.submission || {};
      if (sub.submitted_at) return;
      if (sub.graded_at) return;
      if (sub.excused) return;

      allAssignments.push({
        name: a.name,
        course: courseName,
        due: dueDate
      });

    });
  });

  allAssignments.sort((a, b) => a.due - b.due);

  let currentCourse = null;

  allAssignments.forEach(a => {

    if (a.course !== currentCourse) {
      currentCourse = a.course;

      let courseParagraph = body.appendParagraph("\n" + currentCourse);
      let text = courseParagraph.editAsText();
      text.setBold(0, currentCourse.length - 1, true);
      text.setFontSize(0, currentCourse.length - 1, 15);
    }

    const diffTime = a.due - today;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    let daysText;
    if (diffDays === 0) {
      daysText = "(Due Today)";
    } else if (diffDays === 1) {
      daysText = "(Due in 1 day)";
    } else {
      daysText = `(Due in ${diffDays} days)`;
    }

    const due = a.due.toLocaleDateString();

    body.appendParagraph(
      `• ${a.name}\n   Due: ${due} ${daysText}\n`
    );

  });

  doc.saveAndClose();
}


// ===== Helper Functions =====

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
