'use client';

import { useCourses, useAssignments } from '@/hooks/use-canvas';
import { useHiddenCourses } from '@/hooks/use-hidden-courses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BookOpen,
  FileText,
  ClipboardList,
  CheckCircle,
  Clock,
  ExternalLink,
  X,
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import type { Assignment } from '@/lib/types';

export function CourseCards() {
  const { data: courses, loading: coursesLoading, error } = useCourses();
  const { hiddenCourses, loading: hiddenLoading, hideCourse } = useHiddenCourses();

  const loading = coursesLoading || hiddenLoading;

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Failed to load courses</p>
        </CardContent>
      </Card>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">No courses found</p>
        </CardContent>
      </Card>
    );
  }

  const visibleCourses = courses.filter(c => !hiddenCourses.includes(c.id));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {visibleCourses.map(course => (
        <CourseCard
          key={course.id}
          courseId={course.id}
          courseName={course.name}
          courseCode={course.course_code}
          onHide={() => hideCourse(course.id)}
        />
      ))}
    </div>
  );
}

function CourseCard({
  courseId,
  courseName,
  courseCode,
  onHide,
}: {
  courseId: number;
  courseName: string;
  courseCode: string;
  onHide: () => void;
}) {
  const { data: assignments, loading } = useAssignments(courseId);

  const categorizeAssignments = (items: Assignment[] | null | undefined) => {
    if (!items) return { quizzes: [], tasks: [], other: [] };

    const upcoming = items.filter(a => a.due_at && !isPast(new Date(a.due_at)));

    const quizzes = upcoming.filter(a =>
      a.submission_types?.some(t => t.includes('quiz') || t.includes('online_quiz')) ||
      a.name.toLowerCase().includes('quiz') ||
      a.name.toLowerCase().includes('exam') ||
      a.name.toLowerCase().includes('test')
    );

    const tasks = upcoming.filter(a =>
      !quizzes.includes(a) && (
        a.submission_types?.some(t =>
          t.includes('online_upload') ||
          t.includes('online_text_entry') ||
          t.includes('online_url')
        ) ||
        a.name.toLowerCase().includes('assignment') ||
        a.name.toLowerCase().includes('homework') ||
        a.name.toLowerCase().includes('project')
      )
    );

    const other = upcoming.filter(a => !quizzes.includes(a) && !tasks.includes(a));

    return { quizzes, tasks, other };
  };

  const isSubmitted = (assignment: Assignment) => {
    const state = assignment.submission?.workflow_state;
    return state === 'submitted' || state === 'graded';
  };

  const { quizzes, tasks, other } = categorizeAssignments(assignments);
  const allItems = [...quizzes, ...tasks, ...other].sort((a, b) => {
    if (!a.due_at) return 1;
    if (!b.due_at) return -1;
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            <span className="truncate">{courseCode}</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mr-2 -mt-1"
            onClick={(e) => {
              e.preventDefault();
              onHide();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground truncate">{courseName}</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : allItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming items</p>
        ) : (
          <ScrollArea className="h-48">
            <div className="space-y-2 pr-4">
              {allItems.slice(0, 8).map(item => {
                const submitted = isSubmitted(item);
                const isQuiz = quizzes.includes(item);
                const isTask = tasks.includes(item);

                return (
                  <a
                    key={item.id}
                    href={item.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 rounded-lg border p-2 text-sm transition-colors hover:bg-muted ${
                      submitted ? 'bg-green-500/10 border-green-500/30' : ''
                    }`}
                  >
                    {isQuiz ? (
                      <ClipboardList className="h-3 w-3 text-purple-500 flex-shrink-0" />
                    ) : isTask ? (
                      <FileText className="h-3 w-3 text-blue-500 flex-shrink-0" />
                    ) : (
                      <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`truncate ${submitted ? 'line-through text-muted-foreground' : ''}`}>
                        {item.name}
                      </p>
                      {item.due_at && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.due_at), 'MMM d, h:mm a')}
                        </p>
                      )}
                    </div>
                    {submitted ? (
                      <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                    ) : (
                      <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    )}
                  </a>
                );
              })}
              {allItems.length > 8 && (
                <p className="text-xs text-muted-foreground text-center py-1">
                  +{allItems.length - 8} more items
                </p>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Summary badges */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {quizzes.length > 0 && (
            <Badge variant="outline" className="text-xs">
              <ClipboardList className="h-3 w-3 mr-1" />
              {quizzes.length} quiz{quizzes.length > 1 ? 'zes' : ''}
            </Badge>
          )}
          {tasks.length > 0 && (
            <Badge variant="outline" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              {tasks.length} task{tasks.length > 1 ? 's' : ''}
            </Badge>
          )}
          {other.length > 0 && (
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {other.length} other
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
