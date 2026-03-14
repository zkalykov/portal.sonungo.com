import type {
  User,
  Course,
  Assignment,
  CalendarEvent,
  Announcement,
  DiscussionTopic,
  TodoItem,
  CourseWithGrade,
} from './types';

class CanvasAPI {
  // Use our Next.js API proxy to avoid CORS issues
  private get baseUrl(): string {
    return '/api/canvas';
  }

  private getSessionCredentials(): { url: string; token: string } | null {
    if (typeof window === 'undefined') return null;
    try {
      const url = sessionStorage.getItem('canvas_url');
      const token = sessionStorage.getItem('canvas_token');
      if (url && token) return { url, token };
    } catch {
      // sessionStorage not available
    }
    return null;
  }

  private get isConfiguredOnClient(): boolean {
    // Check sessionStorage first (Telegram auth flow)
    if (this.getSessionCredentials()) return true;
    // Fall back to env vars (legacy / dev)
    return Boolean(
      process.env.NEXT_PUBLIC_CANVAS_BASE_URL &&
      process.env.NEXT_PUBLIC_CANVAS_API_TOKEN
    );
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    console.log('[Canvas API] Fetching:', url);

    const creds = this.getSessionCredentials();
    const customHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (creds) {
      customHeaders['x-canvas-base-url'] = creds.url;
      customHeaders['x-canvas-api-token'] = creds.token;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...customHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Canvas API] Error:', response.status, errorData);
      throw new Error(`Canvas API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Courses
  async getCourses(): Promise<Course[]> {
    return this.fetch<Course[]>('/courses?enrollment_state=active&include[]=total_scores&include[]=term&per_page=50');
  }

  async getCoursesWithGrades(): Promise<CourseWithGrade[]> {
    const courses = await this.fetch<Course[]>(
      '/courses?enrollment_state=active&include[]=total_scores&include[]=enrollments&per_page=50'
    );

    return courses.map(course => {
      const enrollment = course.enrollments?.find(e => e.type === 'student');
      return {
        ...course,
        currentGrade: enrollment?.computed_current_grade ?? undefined,
        currentScore: enrollment?.computed_current_score ?? undefined,
        finalGrade: enrollment?.computed_final_grade ?? undefined,
        finalScore: enrollment?.computed_final_score ?? undefined,
      };
    });
  }

  // Assignments
  async getAssignments(courseId: number): Promise<Assignment[]> {
    return this.fetch<Assignment[]>(
      `/courses/${courseId}/assignments?include[]=submission&include[]=rubric_assessment&order_by=due_at&per_page=100`
    );
  }

  async getAllAssignments(): Promise<Assignment[]> {
    const courses = await this.getCourses();
    const assignmentPromises = courses.map(course => this.getAssignments(course.id));
    const assignmentArrays = await Promise.all(assignmentPromises);
    return assignmentArrays.flat();
  }

  async getUpcomingAssignments(): Promise<Assignment[]> {
    const assignments = await this.getAllAssignments();
    const now = new Date();

    return assignments
      .filter(a => a.due_at && new Date(a.due_at) > now)
      .sort((a, b) => {
        if (!a.due_at) return 1;
        if (!b.due_at) return -1;
        return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
      });
  }

  async submitAssignment(
    courseId: number,
    assignmentId: number,
    submissionData: {
      submission_type: 'online_text_entry' | 'online_url' | 'online_upload';
      body?: string;
      url?: string;
      file_ids?: number[];
    }
  ): Promise<any> {
    return this.fetch(`/courses/${courseId}/assignments/${assignmentId}/submissions`, {
      method: 'POST',
      body: JSON.stringify({ submission: submissionData }),
    });
  }

  // File Upload Process (3 steps)
  async uploadFile(courseId: number, assignmentId: number, file: File): Promise<number | undefined> {
    try {
      // Step 1: Tell Canvas we want to upload a file
      const step1Response = await this.fetch<any>(
        `/courses/${courseId}/assignments/${assignmentId}/submissions/self/files`,
        {
          method: 'POST',
          body: JSON.stringify({
            name: file.name,
            size: file.size,
            content_type: file.type || 'application/octet-stream',
          }),
        }
      );

      const { upload_url, upload_params } = step1Response;

      // Step 2: Upload the file directly to the provided URL (often S3 or Canvas itself)
      // This MUST be multipart/form-data
      const formData = new FormData();
      Object.entries(upload_params || {}).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      formData.append('file', file);

      // We do NOT use this.fetch because upload_url is a full absolute URL, not an API endpoint!
      const step2Response = await fetch(upload_url, {
        method: 'POST',
        body: formData,
        // Let the browser set the boundary headers
      });

      if (!step2Response.ok) {
        throw new Error('File upload failed at Step 2');
      }

      // Step 3: Some Canvas instances return the file object directly in Step 2, 
      // or return JSON. Others redirect to a success URL. 
      // If it returned JSON with an id, we're done.
      const responseContentType = step2Response.headers.get('content-type') || '';
      if (responseContentType.includes('application/json')) {
        const fileData = await step2Response.json();
        return fileData.id;
      }

      // If there's a redirect or we need to hit the success URL proxy-style?
      // For Canvas S3 uploads, the step 2 response is often a 302, but browser fetch follows it.
      // So the final response is the JSON from Canvas!
      // However, sometimes it is plain text or empty. 
      // This part depends heavily on the specific Canvas instance settings.
      // Easiest is to try parsing JSON:
      try {
        const fileData = await step2Response.json();
        return fileData.id;
      } catch (e) {
        console.warn('Could not parse step 2 file response as JSON. Checking for Location header...', e);
      }

      return undefined;
    } catch (e) {
      console.error('[Canvas API] uploadFile error:', e);
      throw e;
    }
  }

  // Calendar
  async getCalendarEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    const courses = await this.getCourses();
    const contextCodes = courses.map(c => `course_${c.id}`).join('&context_codes[]=');

    return this.fetch<CalendarEvent[]>(
      `/calendar_events?type=event&start_date=${startDate}&end_date=${endDate}&context_codes[]=${contextCodes}&per_page=100`
    );
  }

  async getCalendarAssignments(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    const courses = await this.getCourses();
    const contextCodes = courses.map(c => `course_${c.id}`).join('&context_codes[]=');

    return this.fetch<CalendarEvent[]>(
      `/calendar_events?type=assignment&start_date=${startDate}&end_date=${endDate}&context_codes[]=${contextCodes}&per_page=100`
    );
  }

  async getAllCalendarItems(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    const [events, assignments] = await Promise.all([
      this.getCalendarEvents(startDate, endDate),
      this.getCalendarAssignments(startDate, endDate),
    ]);

    return [...events, ...assignments].sort((a, b) =>
      new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    );
  }

  // Announcements
  async getAnnouncements(): Promise<Announcement[]> {
    const courses = await this.getCourses();
    const contextCodes = courses.map(c => `course_${c.id}`).join('&context_codes[]=');

    return this.fetch<Announcement[]>(
      `/announcements?context_codes[]=${contextCodes}&per_page=50`
    );
  }

  // Discussions
  async getDiscussionTopics(courseId: number): Promise<DiscussionTopic[]> {
    const topics = await this.fetch<DiscussionTopic[]>(
      `/courses/${courseId}/discussion_topics?order_by=recent_activity&per_page=50`
    );
    return topics.map(topic => ({ ...topic, course_id: courseId }));
  }

  async getAllDiscussions(): Promise<DiscussionTopic[]> {
    const courses = await this.getCourses();
    const discussionPromises = courses.map(course => this.getDiscussionTopics(course.id));
    const discussionArrays = await Promise.all(discussionPromises);
    return discussionArrays.flat().sort((a, b) => {
      const dateA = a.last_reply_at || a.posted_at;
      const dateB = b.last_reply_at || b.posted_at;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }

  async getDiscussionEntries(courseId: number, topicId: number): Promise<any[]> {
    return this.fetch<any[]>(
      `/courses/${courseId}/discussion_topics/${topicId}/entries`
    );
  }

  async postDiscussionReply(courseId: number, topicId: number, message: string, entryId?: number): Promise<any> {
    const endpoint = entryId 
      ? `/courses/${courseId}/discussion_topics/${topicId}/entries/${entryId}/replies`
      : `/courses/${courseId}/discussion_topics/${topicId}/entries`;
      
    return this.fetch<any>(endpoint, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // To-Do
  async getTodoItems(): Promise<TodoItem[]> {
    return this.fetch<TodoItem[]>('/users/self/todo?per_page=50');
  }

  // Quizzes

  async getQuizzes(courseId: number): Promise<any[]> {
    return this.fetch<any[]>(`/courses/${courseId}/quizzes?per_page=50`);
  }

  async getQuiz(courseId: number, quizId: number): Promise<any> {
    return this.fetch<any>(`/courses/${courseId}/quizzes/${quizId}`);
  }

  async getQuizQuestions(courseId: number, quizId: number): Promise<any[]> {
    return this.fetch<any[]>(`/courses/${courseId}/quizzes/${quizId}/questions?per_page=100`);
  }

  async startQuizSubmission(courseId: number, quizId: number): Promise<any> {
    return this.fetch<any>(`/courses/${courseId}/quizzes/${quizId}/submissions`, {
      method: 'POST',
    });
  }

  async postQuizAnswers(courseId: number, quizId: number, submissionId: number, attempt: number, validationToken: string, answers: any[]): Promise<any> {
    // Canvas requires answers in a specific format for submission
    // We send payload to the quiz_submissions/:id/questions endpoint or submit directly
    
    // 1. First save the questions (if needed by Canvas version, but often we just submit all at once or one by one)
    // To simplify for V1, we will hit the "Complete" endpoint.
    
    // According to Canvas API:
    // To answer questions: POST /api/v1/quiz_submissions/:quiz_submission_id/questions
    // Body: { attempt: int, validation_token: string, quiz_questions: [{id: int, answer: any}] }
    
    await this.fetch<any>(`/quiz_submissions/${submissionId}/questions`, {
      method: 'POST',
      body: JSON.stringify({
        attempt,
        validation_token: validationToken,
        quiz_questions: answers,
      }),
    });

    // 2. Complete the quiz 
    // POST /api/v1/courses/:course_id/quizzes/:quiz_id/submissions/:id/complete
    return this.fetch<any>(`/courses/${courseId}/quizzes/${quizId}/submissions/${submissionId}/complete`, {
      method: 'POST',
      body: JSON.stringify({
        attempt,
        validation_token: validationToken,
      }),
    });
  }
  async getCurrentUser(): Promise<User> {
    return this.fetch<User>('/users/self/profile');
  }

  // Helper to check if API is configured
  isConfigured(): boolean {
    return this.isConfiguredOnClient;
  }
}

export const canvasApi = new CanvasAPI();
export default canvasApi;
