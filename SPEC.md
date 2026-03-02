# Canvas Dashboard - Project Specification

A unified dashboard for Canvas LMS that brings everything a student needs into one clean interface.

## Tech Stack

- **Framework:** Next.js (SPA mode)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **Deployment:** Local only (for now)

## Authentication

- Canvas API token stored in `.env.local`
- User generates token from Canvas Account Settings → Approved Integrations
- Environment variable: `CANVAS_API_TOKEN`
- Canvas instance URL: `CANVAS_BASE_URL`

## V1 Features

### 1. Unified Calendar
All assignments, events, and due dates displayed in a single calendar view.
- Monthly/weekly/daily views
- Color-coded by course
- Click to view assignment details

### 2. Grades Overview
Current grades across all courses at a glance.
- Course cards showing current grade/percentage
- Letter grade and points breakdown
- Link to full grade details in Canvas

### 3. Upcoming Assignments
Prioritized list of assignments due soon.
- Sorted by due date
- Shows course, assignment name, due date/time
- Submission status indicator
- Quick link to submit in Canvas

### 4. Assignment Details/Assets
View assignment descriptions, attached files, and rubrics.
- Full assignment description
- Download attached files
- View rubric criteria and points
- Submission history

### 5. Workload Heatmap
Visualize busy weeks based on assignment due dates.
- Calendar heatmap showing assignment density
- Color intensity = number of items due
- Helps with planning and time management

### 6. Due Date Countdowns
Visual countdowns for important deadlines.
- Countdown timers for upcoming assignments
- Configurable alerts (1 day, 3 days, 1 week)
- Priority highlighting for imminent deadlines

### 7. To-Do List
Personal task list integrated with Canvas items.
- Canvas to-do items auto-synced
- Add personal tasks
- Mark items complete
- Filter by course or type

### 8. Announcements Feed
All course announcements in one stream.
- Chronological feed from all courses
- Mark as read/unread
- Course filter
- Search announcements

### 9. Discussion Tracker
Track discussions and replies.
- Unread discussion posts
- Replies to your posts
- Recent activity across all courses
- Quick link to participate

### 10. Dark Mode
Theme toggle for comfortable viewing.
- Light/dark mode toggle
- System preference detection
- Persistent preference

## Canvas API Endpoints

| Feature | Endpoint |
|---------|----------|
| Courses | `GET /api/v1/courses` |
| Assignments | `GET /api/v1/courses/:id/assignments` |
| Calendar Events | `GET /api/v1/calendar_events` |
| Grades/Enrollments | `GET /api/v1/courses/:id/enrollments` |
| Files | `GET /api/v1/courses/:id/files` |
| Announcements | `GET /api/v1/announcements` |
| Discussions | `GET /api/v1/courses/:id/discussion_topics` |
| To-Do Items | `GET /api/v1/users/self/todo` |
| Submissions | `GET /api/v1/courses/:id/assignments/:id/submissions` |

## Project Structure (Proposed)

```
canvas-dashboard/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Dashboard home
│   │   ├── calendar/
│   │   ├── grades/
│   │   ├── assignments/
│   │   ├── announcements/
│   │   └── discussions/
│   ├── components/
│   │   ├── ui/                   # shadcn components
│   │   ├── calendar/
│   │   ├── grades/
│   │   ├── assignments/
│   │   ├── heatmap/
│   │   ├── countdown/
│   │   ├── todo/
│   │   └── layout/
│   ├── lib/
│   │   ├── canvas-api.ts         # API client
│   │   ├── utils.ts
│   │   └── types.ts              # TypeScript types
│   └── hooks/
│       ├── use-courses.ts
│       ├── use-assignments.ts
│       └── use-calendar.ts
├── .env.local                    # API token (git-ignored)
├── .env.example                  # Template for env vars
├── tailwind.config.ts
├── next.config.js
└── package.json
```

## Environment Variables

```env
# .env.local
CANVAS_API_TOKEN=your_canvas_api_token_here
CANVAS_BASE_URL=https://your-institution.instructure.com
```

## UI/UX Notes

- Clean, minimal interface
- Sidebar navigation for main sections
- Dashboard home shows summary widgets
- Responsive design for different screen sizes
- Loading states and error handling
- Keyboard navigation support

## Future Considerations (Post-V1)

- Grade trends/analytics
- GPA calculator
- Inbox/messages
- Global search
- File manager
- Offline mode
- Export/backup
- Quick submission
- Mobile app (React Native)
- Notifications/alerts
