'use client';

import { useAuth } from '@/lib/auth-context';
import { UpcomingAssignments } from '@/components/dashboard/upcoming-assignments';
import { GradesOverview } from '@/components/dashboard/grades-overview';
import { WorkloadHeatmap } from '@/components/dashboard/workload-heatmap';
import { DueCountdowns } from '@/components/dashboard/due-countdowns';
import { TodoList } from '@/components/dashboard/todo-list';
import { AnnouncementsFeed } from '@/components/dashboard/announcements-feed';
import { DiscussionsTracker } from '@/components/dashboard/discussions-tracker';
import { CourseCards } from '@/components/dashboard/course-cards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Send } from 'lucide-react';

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="max-w-md w-full mx-4 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <MessageCircle className="h-7 w-7 text-blue-500" />
            </div>
            <CardTitle className="text-xl">Welcome to Canvas Portal</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              To access your Canvas dashboard, please authenticate via our Telegram bot.
              Type <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">/portal</code> in the bot to get your login link.
            </p>
            <a
              href="https://t.me/canvas_sonungo_com_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <Send className="h-4 w-4" />
              Open Telegram Bot
            </a>
            <p className="text-xs text-muted-foreground pt-2">
              The auth link expires in 1 minute and can only be used once.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-w-0">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Top row - Key metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 min-w-0">
        <div className="min-w-0"><DueCountdowns /></div>
        <div className="min-w-0"><WorkloadHeatmap /></div>
        <div className="min-w-0"><TodoList /></div>
      </div>

      {/* Course cards with assignments/quizzes/tasks */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Your Courses</h2>
        <CourseCards />
      </div>

      {/* Lists row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <UpcomingAssignments />
        <AnnouncementsFeed />
        <DiscussionsTracker />
      </div>

      {/* Grades overview at the bottom */}
      <GradesOverview />
    </div>
  );
}
