# Automating Canvas To-Do List To Google Docs
Scripting that allows for current Canvas to-do list to be uploaded to Google Docs. Useful for a homework to-do list to easily keep track of assignments in a real-time document.

# Canvas Homework Sync

Automatically syncs upcoming Canvas assignments (next 2 weeks) into a formatted Google Doc.

## Features

* Shows only assignments due within 14 days
* Filters out submitted / graded / excused work
* Handles differentiated due dates (lab courses supported)
* Automatically updates via time-based trigger
* Clean formatted Google Doc output

---

## Setup Instructions

### 1. Generate Canvas API Token

1. Canvas → Account → Settings
2. Delete old token (if needed)
3. Create new token
4. Copy token

---

### 2. Set Up Google Apps Script

1. Go to https://script.google.com
2. Create New Project
3. Replace contents of `Code.gs` with the repo version
4. Insert your:

   * `CANVAS_TOKEN`
   * `GOOGLE_DOC_ID`
   * `COURSE_IDS`

---

### 3. Authorize Script

Run `updateHomeworkDoc()` once and approve permissions.

---

### 4. Add Trigger

Triggers → Add Trigger

* Function: `updateHomeworkDoc`
* Event source: Time-driven
* Minute timer → Every minute

---

## Security Note

Never commit your real Canvas API token.
If exposed, regenerate immediately.

---

## Author
Phoenix Allen
