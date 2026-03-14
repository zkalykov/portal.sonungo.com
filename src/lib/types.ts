// Canvas API Types

export interface User {
  id: number;
  name: string;
  short_name: string;
  sortable_name: string;
  avatar_url: string;
  email?: string;
  login_id?: string;
  bio?: string;
  primary_email?: string;
  time_zone?: string;
}

export interface Course {
  id: number;
  name: string;
  course_code: string;
  enrollment_term_id: number;
  start_at: string | null;
  end_at: string | null;
  workflow_state: string;
  default_view: string;
  enrollments?: Enrollment[];
}

export interface Enrollment {
  type: string;
  role: string;
  enrollment_state: string;
  computed_current_score: number | null;
  computed_final_score: number | null;
  computed_current_grade: string | null;
  computed_final_grade: string | null;
}

export interface Assignment {
  id: number;
  name: string;
  description: string | null;
  due_at: string | null;
  lock_at: string | null;
  unlock_at: string | null;
  course_id: number;
  html_url: string;
  points_possible: number;
  submission_types: string[];
  has_submitted_submissions: boolean;
  quiz_id?: number;
  rubric?: RubricCriterion[];
  submission?: Submission;
}

export interface Submission {
  id: number;
  assignment_id: number;
  user_id: number;
  submitted_at: string | null;
  score: number | null;
  grade: string | null;
  workflow_state: string;
  late: boolean;
  missing: boolean;
  attachments?: Attachment[];
}

export interface RubricCriterion {
  id: string;
  description: string;
  long_description?: string;
  points: number;
  ratings: RubricRating[];
}

export interface RubricRating {
  id: string;
  description: string;
  points: number;
}

export interface CalendarEvent {
  id: number;
  title: string;
  start_at: string;
  end_at: string;
  description: string | null;
  context_code: string;
  context_name: string;
  workflow_state: string;
  type: 'event' | 'assignment';
  html_url: string;
  assignment?: Assignment;
}

export interface Announcement {
  id: number;
  title: string;
  message: string;
  posted_at: string;
  context_code: string;
  author: {
    id: number;
    display_name: string;
    avatar_image_url: string;
  };
  read_state: 'read' | 'unread';
  html_url: string;
}

export interface DiscussionTopic {
  id: number;
  title: string;
  message: string;
  posted_at: string;
  last_reply_at: string | null;
  discussion_subentry_count: number;
  read_state: 'read' | 'unread';
  unread_count: number;
  html_url: string;
  author: {
    id: number;
    display_name: string;
    avatar_image_url: string;
  };
  course_id: number;
}

export interface TodoItem {
  type: string;
  assignment?: Assignment;
  context_type: string;
  context_name: string;
  html_url: string;
}

export interface Attachment {
  id: number;
  display_name: string;
  filename: string;
  url: string;
  size: number;
  content_type: string;
  created_at: string;
}

export interface DiscussionEntry {
  id: number;
  user_id: number;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
  message: string;
  user_name: string;
  user?: {
    id: number;
    display_name: string;
    avatar_image_url: string;
    html_url?: string;
  };
  can_rate?: boolean;
  rating_sum?: number;
  rating_count?: number;
  has_more_replies?: boolean;
  replies?: DiscussionEntry[];
}

export interface Quiz {
  id: number;
  title: string;
  html_url: string;
  mobile_url: string;
  description: string;
  quiz_type: string;
  time_limit: number | null;
  shuffle_answers: boolean;
  show_correct_answers: boolean;
  scoring_policy: string;
  point_value: number;
  question_count: number;
  has_access_code: boolean;
  due_at: string | null;
  lock_at: string | null;
  unlock_at: string | null;
  published: boolean;
  locked_for_user: boolean;
  lock_info?: any;
  lock_explanation?: string;
}

export interface QuizSubmission {
  id: number;
  quiz_id: number;
  user_id: number;
  submission_id: number;
  started_at: string;
  finished_at: string | null;
  end_at: string | null;
  attempt: number;
  extra_attempts: number;
  extra_time: number;
  time_spent: number;
  score: number;
  score_before_regrade: number;
  kept_score: number;
  fudge_points: number;
  has_seen_results: boolean;
  workflow_state: 'untaken' | 'pending_review' | 'complete' | 'settings_only' | 'preview';
  validation_token: string;
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  position: number;
  question_name: string;
  question_type: string;
  question_text: string;
  points_possible: number;
  correct_comments: string;
  incorrect_comments: string;
  neutral_comments: string;
  answers: {
    id: number;
    text: string;
    html: string;
    comments: string;
    weight: number;
  }[];
}

// App-specific types

export interface PersonalTask {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  courseId?: number;
  createdAt: string;
}

export interface CourseWithGrade extends Course {
  currentGrade?: string;
  currentScore?: number;
  finalGrade?: string;
  finalScore?: number;
}

export interface CalendarDay {
  date: Date;
  events: CalendarEvent[];
  assignments: Assignment[];
}

export interface WorkloadData {
  date: string;
  count: number;
  assignments: Assignment[];
}
