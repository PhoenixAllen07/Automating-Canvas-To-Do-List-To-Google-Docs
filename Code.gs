// ======== CONFIG ========
const CANVAS_BASE_URL = "https://your-school.instructure.com";
const CANVAS_TOKEN = "PASTE_YOUR_CANVAS_TOKEN_HERE";
const COURSE_IDS = ["12345", "67890"]; // Replace with your course IDs
const GOOGLE_DOC_ID = "PASTE_YOUR_GOOGLE_DOC_ID_HERE";

// MAIN FUNCTION

function updateHomeworkDoc() {

  const doc = DocumentApp.openById(GOOGLE_DOC_ID);
  const body = doc.getBody();
  body.clear();

  if (doc.getHeader()) {
    doc.getHeader().clear();
  }

  doc.setMarginTop(36);

  const title = body.appendParagraph("Homework To-Do List");
  title.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  const today = new Date();
  today.setHours(0,0,0,0);

  const twoWeeks = new Date(today);
  twoWeeks.setDate(today.getDate() + 14);

  const plannerItems = getPlannerItems();

  let assignments = [];

  plannerItems.forEach(item => {

    if (!item.plannable_date) return;

    const dueDate = new Date(item.plannable_date);
    dueDate.setHours(0,0,0,0);

    if (dueDate < today) return;
    if (dueDate > twoWeeks) return;

    if (item.planner_override?.marked_complete === true) return;
    if (item.submissions?.submitted === true) return;
    if (item.plannable_type == "calendar_event") return;
    assignments.push({
      name: item.plannable.title,
      course: item.course_id,
      due: dueDate
    });

  });

  // Sort by due date
  assignments.sort((a,b) => a.due - b.due);

  // Cache course names
  const courseNames = {};

  assignments.forEach(a => {
    if (!courseNames[a.course]) {
      courseNames[a.course] = getCourseName(a.course);
    }
  });

  let currentCourse = null;

  assignments.forEach(a => {
    const courseName = courseNames[a.course];

    if (courseName !== currentCourse) {

      currentCourse = courseName;

      const courseParagraph = body.appendParagraph("\n" + courseName);
      const text = courseParagraph.editAsText();

      text.setBold(0, courseName.length, true);
      text.setFontSize(0, courseName.length, 15);

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

    const p = body.appendParagraph(`• ${a.name}\nDue: ${due} ${daysText}\n`);

// formatting
p.setIndentStart(7);      // moves both lines right
p.setIndentFirstLine(0);   // bullet stays left

  });

  doc.saveAndClose();
}

// PLANNER ITEMS

function getPlannerItems() {

  let url = `${CANVAS_BASE_URL}/api/v1/planner/items?per_page=100`;

  let items = [];

  while (url) {

    const response = UrlFetchApp.fetch(url, {
      headers: { "Authorization": "Bearer " + CANVAS_TOKEN }
    });

    const page = JSON.parse(response.getContentText());
    items = items.concat(page);

    const linkHeader = response.getHeaders()['Link'];

    if (linkHeader && linkHeader.includes('rel="next"')) {

      const match = linkHeader.match(/<([^>]+)>; rel="next"/);
      url = match ? match[1] : null;

    } else {

      url = null;

    }

  }
  

  return items;
}

// COURSE NAME

function getCourseName(courseId) {

  const url = `${CANVAS_BASE_URL}/api/v1/courses/${courseId}`;

  const response = UrlFetchApp.fetch(url, {
    headers: { "Authorization": "Bearer " + CANVAS_TOKEN }
  });

  const course = JSON.parse(response.getContentText());

  return course.name;
}
