'use client';

import { useState, useEffect, useCallback } from 'react';
import canvasApi from '@/lib/canvas-api';
import type {
  User,
  CourseWithGrade,
  Assignment,
  CalendarEvent,
  Announcement,
  DiscussionTopic,
  TodoItem,
} from '@/lib/types';

import useSWR from 'swr';

// Generic hook for data fetching
function useCanvasData<T>(
  key: string | null,
  fetcher: () => Promise<T>
) {
  const { data, error, isLoading, mutate } = useSWR<T>(
    key,
    fetcher,
    {
      revalidateOnFocus: false, // Don't constantly refetch when switching tabs
      dedupingInterval: 60000, // Deduplicate requests within 1 minute
      errorRetryCount: 1, // Minimize aggressive retries on error
    }
  );

  return { 
    data, 
    loading: isLoading, 
    error, 
    refetch: mutate 
  };
}

// Courses with grades
export function useCourses() {
  return useCanvasData<CourseWithGrade[]>('canvas_courses_grades', () => canvasApi.getCoursesWithGrades());
}

// Assignments
export function useAssignments(courseId?: number) {
  return useCanvasData<Assignment[]>(
    courseId ? `canvas_assignments_${courseId}` : 'canvas_all_assignments',
    () => courseId ? canvasApi.getAssignments(courseId) : canvasApi.getAllAssignments()
  );
}

export function useUpcomingAssignments() {
  return useCanvasData<Assignment[]>('canvas_upcoming_assignments', () => canvasApi.getUpcomingAssignments());
}

// Calendar
export function useCalendar(startDate: string, endDate: string) {
  return useCanvasData<CalendarEvent[]>(
    `canvas_calendar_${startDate}_${endDate}`,
    () => canvasApi.getAllCalendarItems(startDate, endDate)
  );
}

// Announcements
export function useAnnouncements() {
  return useCanvasData<Announcement[]>('canvas_announcements', () => canvasApi.getAnnouncements());
}

// Discussions
export function useDiscussions() {
  return useCanvasData<DiscussionTopic[]>('canvas_discussions', () => canvasApi.getAllDiscussions());
}

// To-Do
export function useTodoItems() {
  return useCanvasData<TodoItem[]>('canvas_todo', () => canvasApi.getTodoItems());
}

// User
export function useUser() {
  return useCanvasData<User>('canvas_user', () => canvasApi.getCurrentUser());
}

// Check if API is configured
export function useCanvasConfig() {
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    setIsConfigured(canvasApi.isConfigured());
  }, []);

  return isConfigured;
}
