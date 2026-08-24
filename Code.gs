// ======== CONFIG ========
const CANVAS_BASE_URL = "https://your-school.instructure.com";
const CANVAS_TOKEN = "PASTE_YOUR_CANVAS_TOKEN_HERE";
const COURSE_IDS = ["12345", "67890"]; // Replace with your course IDs
const GOOGLE_DOC_ID = "PASTE_YOUR_GOOGLE_DOC_ID_HERE";

// ============================================================
// MAIN FUNCTION
// ============================================================

function updateHomeworkDoc() {

  const doc = DocumentApp.openById(GOOGLE_DOC_ID);
  const body = doc.getBody();

  // Clear existing document content
  body.clear();

  // Clear header if one exists
  if (doc.getHeader()) {
    doc.getHeader().clear();
  }

  // Reduce the large blank area at the top of the page
  doc.setMarginTop(10);

  // Optional cleaner page margins
  doc.setMarginBottom(20);
  doc.setMarginLeft(72);
  doc.setMarginRight(72);


  // ============================================================
  // TITLE
  // ============================================================

  const title = body.appendParagraph("Homework To-Do List");

  title.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  // Remove unnecessary spacing around the title
  title.setSpacingBefore(0);
  title.setSpacingAfter(10);


  // ============================================================
  // DATE RANGE
  // ============================================================

  const today = new Date();

  // Start today at midnight
  today.setHours(0, 0, 0, 0);

  // Only display assignments due within the next 14 days
  const twoWeeks = new Date(today);
  twoWeeks.setDate(today.getDate() + 14);


  // ============================================================
  // GET CANVAS PLANNER ITEMS
  // ============================================================

  const plannerItems = getPlannerItems();

  let assignments = [];


  // ============================================================
  // FILTER ASSIGNMENTS
  // ============================================================

  plannerItems.forEach(item => {

    // Skip anything without a date
    if (!item.plannable_date) {
      return;
    }

    // Skip anything that is not associated with a course
    if (!item.course_id) {
      return;
    }

    // Skip announcements and resources
    if (
      item.plannable_type === "announcement" ||
      item.plannable_type === "resource"
    ) {
      return;
    }

    // Skip calendar events
    if (item.plannable_type === "calendar_event") {
      return;
    }


    // ============================================================
    // DUE DATE
    // ============================================================

    const dueDate = new Date(item.plannable_date);

    /*
      If Canvas only supplies a date with no real time,
      treat it as due at 11:59 PM instead of midnight.
    */

    if (
      dueDate.getHours() === 0 &&
      dueDate.getMinutes() === 0
    ) {
      dueDate.setHours(23, 59, 0, 0);
    }


    // Date used only for determining whether it is overdue
    const dueDateOnly = new Date(dueDate);
    dueDateOnly.setHours(0, 0, 0, 0);


    // Skip assignments already past due
    if (dueDateOnly < today) {
      return;
    }

    // Skip assignments more than two weeks away
    if (dueDateOnly > twoWeeks) {
      return;
    }

    // Skip items manually marked complete
    if (
      item.planner_override &&
      item.planner_override.marked_complete === true
    ) {
      return;
    }

    // Skip submitted assignments
    if (
      item.submissions &&
      item.submissions.submitted === true
    ) {
      return;
    }


    // ============================================================
    // ADD ASSIGNMENT
    // ============================================================

    assignments.push({

      name: item.plannable.title
        .replace(/\s+/g, " ")
        .trim(),

      course: item.course_id,

      due: dueDate

    });

  });


  // ============================================================
  // SORT BY DUE DATE
  // ============================================================

  assignments.sort((a, b) => {
    return a.due - b.due;
  });


  // ============================================================
  // CACHE COURSE NAMES
  // ============================================================

  const courseNames = {};

  assignments.forEach(assignment => {

    if (!courseNames[assignment.course]) {

      courseNames[assignment.course] =
        getCourseName(assignment.course);

    }

  });


  // ============================================================
  // PRINT ASSIGNMENTS
  // ============================================================

  let currentCourse = null;


  assignments.forEach(assignment => {

    const courseName =
      courseNames[assignment.course];


    // ============================================================
    // COURSE HEADER
    // ============================================================

    if (courseName !== currentCourse) {

      currentCourse = courseName;

      // Do NOT add "\n" before the course name.
      // That was creating extra blank space.
      const courseParagraph =
        body.appendParagraph(courseName);

      courseParagraph.setSpacingBefore(12);
      courseParagraph.setSpacingAfter(4);

      const courseText =
        courseParagraph.editAsText();

      courseText.setBold(
        0,
        courseName.length - 1,
        true
      );

      courseText.setFontSize(
        0,
        courseName.length - 1,
        15
      );

    }


    // ============================================================
    // DAYS UNTIL DUE
    // ============================================================

    const dueDateOnly =
      new Date(assignment.due);

    dueDateOnly.setHours(0, 0, 0, 0);

    const diffTime =
      dueDateOnly - today;

    const diffDays =
      Math.round(
        diffTime /
        (1000 * 60 * 60 * 24)
      );


    let daysText;

    if (diffDays === 0) {

      daysText = "(Due Today)";

    } else if (diffDays === 1) {

      daysText = "(Due in 1 day)";

    } else {

      daysText =
        `(Due in ${diffDays} days)`;

    }


    // ============================================================
    // FORMAT DATE
    // ============================================================

    const datePart =
      assignment.due.toLocaleDateString(
        [],
        {
          month: "numeric",
          day: "numeric",
          year: "numeric"
        }
      );


    const timePart =
      assignment.due.toLocaleTimeString(
        [],
        {
          hour: "numeric",
          minute: "2-digit"
        }
      );


    const due =
      `${datePart} @ ${timePart}`;


    // ============================================================
    // ASSIGNMENT TEXT
    // ============================================================

    const assignmentParagraph =
      body.appendParagraph(
        `• ${assignment.name}\n` +
        `Due: ${due} ${daysText}`
      );


    // Small indentation
    assignmentParagraph.setIndentStart(9);
    assignmentParagraph.setIndentFirstLine(0);

    // Keep normal assignment text at 12 pt
    assignmentParagraph.setFontSize(12);

    // Cleaner spacing between assignments
    assignmentParagraph.setSpacingBefore(0);
    assignmentParagraph.setSpacingAfter(6);


    // ============================================================
    // ENLARGE ONLY THE BULLET
    // ============================================================

    const assignmentText =
      assignmentParagraph.editAsText();

    assignmentText.setFontSize(
      0,
      0,
      16
    );

  });


  // ============================================================
  // SAVE
  // ============================================================

  doc.saveAndClose();

}


// ============================================================
// GET PLANNER ITEMS
// ============================================================

function getPlannerItems() {

  let url =
    `${CANVAS_BASE_URL}/api/v1/planner/items?per_page=100`;

  let items = [];


  while (url) {

    const response =
      UrlFetchApp.fetch(
        url,
        {
          headers: {
            "Authorization":
              "Bearer " + CANVAS_TOKEN
          }
        }
      );


    const page =
      JSON.parse(
        response.getContentText()
      );


    items =
      items.concat(page);


    // Canvas pagination
    const linkHeader =
      response.getHeaders()["Link"];


    if (
      linkHeader &&
      linkHeader.includes('rel="next"')
    ) {

      const match =
        linkHeader.match(
          /<([^>]+)>; rel="next"/
        );

      url =
        match
          ? match[1]
          : null;

    } else {

      url = null;

    }

  }


  return items;

}


// ============================================================
// GET COURSE NAME
// ============================================================

function getCourseName(courseId) {

  const url =
    `${CANVAS_BASE_URL}/api/v1/courses/${courseId}`;


  const response =
    UrlFetchApp.fetch(
      url,
      {
        headers: {
          "Authorization":
            "Bearer " + CANVAS_TOKEN
        }
      }
    );


  const course =
    JSON.parse(
      response.getContentText()
    );


  return course.name;

}
