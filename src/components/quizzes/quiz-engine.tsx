'use client';

import { useState, useEffect } from 'react';
import { canvasApi } from '@/lib/canvas-api';
import type { Quiz, QuizSubmission, QuizQuestion } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface QuizEngineProps {
  courseId: number;
  quiz: Quiz;
  onComplete?: () => void;
}

export function QuizEngine({ courseId, quiz, onComplete }: QuizEngineProps) {
  const [submission, setSubmission] = useState<QuizSubmission | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const startQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      // 1. Get Questions
      const qs = await canvasApi.getQuizQuestions(courseId, quiz.id);
      setQuestions(qs);
      
      // 2. Start Submission
      const subRes = await canvasApi.startQuizSubmission(courseId, quiz.id);
      
      // The API often returns { quiz_submissions: [...] }
      if (subRes.quiz_submissions && subRes.quiz_submissions.length > 0) {
        setSubmission(subRes.quiz_submissions[0]);
      } else {
        setSubmission(subRes);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: number, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const submitQuiz = async () => {
    if (!submission) return;
    try {
      setSubmitting(true);
      setError(null);

      // format answers for Canvas
      const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
        id: parseInt(qId),
        answer: ans
      }));

      await canvasApi.postQuizAnswers(
        courseId, 
        quiz.id, 
        submission.id, 
        submission.attempt, 
        submission.validation_token, 
        formattedAnswers
      );

      setSubmitted(true);
      if (onComplete) onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  // Intro Screen
  if (!submission && !loading && !submitted) {
    return (
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle>Quiz Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div 
            className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: quiz.description }}
          />
          <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-4 rounded-md">
            <div><strong>Questions:</strong> {quiz.question_count}</div>
            <div><strong>Points:</strong> {quiz.point_value}</div>
            {quiz.time_limit && (
              <div className="flex items-center gap-1 col-span-2 text-orange-500 font-medium pt-2">
                <Clock className="w-4 h-4" /> Time Limit: {quiz.time_limit} Minutes
              </div>
            )}
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {quiz.quiz_type === 'practice_quiz' || quiz.quiz_type === 'assignment' ? (
             <Button onClick={startQuiz}>Begin Quiz</Button>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              This quiz type ({quiz.quiz_type.replace(/_/g, ' ')}) cannot be taken here. Please open in Canvas.
            </p>
          )}
        </CardFooter>
      </Card>
    );
  }

  // Loading Screen
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Submitted Screen
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 bg-green-500/10 rounded-lg border border-green-500/20 text-green-700 dark:text-green-400">
        <CheckCircle className="h-12 w-12" />
        <h3 className="text-xl font-bold">Quiz Submitted!</h3>
        <p>Your answers have been successfully recorded in Canvas.</p>
      </div>
    );
  }

  // Actual Quiz Engine
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {quiz.time_limit && submission?.started_at && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-3 border-b border-orange-500/20 flex justify-between items-center text-orange-500 font-medium">
           <span className="flex items-center gap-2">
             <Clock className="w-4 h-4" /> Started {formatDistanceToNow(new Date(submission.started_at), { addSuffix: true })}
           </span>
           <span>Time Limit: {quiz.time_limit} mins</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {questions.map((q, idx) => (
          <Card key={q.id}>
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex justify-between items-start">
                 <span className="font-semibold text-sm text-muted-foreground">Question {idx + 1}</span>
                 <span className="text-xs font-medium text-muted-foreground">{q.points_possible} pts</span>
              </div>
              <CardTitle className="text-lg mt-2">
                <div dangerouslySetInnerHTML={{ __html: q.question_text }} className="prose prose-sm dark:prose-invert max-w-none" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {q.question_type === 'multiple_choice_question' || q.question_type === 'true_false_question' ? (
                <RadioGroup 
                  onValueChange={(val: string) => handleAnswerChange(q.id, val)}
                  value={answers[q.id]?.toString()}
                  className="space-y-3"
                >
                  {q.answers.map(ans => (
                    <div className="flex items-center gap-2 bg-muted/30 p-3 rounded-md border border-border/50 hover:bg-muted/50 transition-colors" key={ans.id}>
                      <RadioGroupItem value={ans.id.toString()} id={`ans-${ans.id}`} />
                      <Label htmlFor={`ans-${ans.id}`} className="cursor-pointer flex-1 font-normal leading-relaxed">
                         <div dangerouslySetInnerHTML={{ __html: ans.html || ans.text }} />
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : q.question_type === 'essay_question' || q.question_type === 'short_answer_question' ? (
                <textarea
                  className="w-full min-h-[150px] p-3 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Type your answer here..."
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                />
              ) : (
                <div className="p-4 bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 rounded-md text-sm border border-yellow-500/20">
                  ⚠️ This question type ({q.question_type}) is not fully supported natively yet. 
                  You may need to answer this on the main Canvas website.
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t sticky bottom-0 bg-background/95 backdrop-blur pb-4">
        <Button size="lg" onClick={submitQuiz} disabled={submitting}>
          {submitting ? (
             <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...</>
          ) : (
             'Submit Quiz'
          )}
        </Button>
      </div>
    </div>
  );
}
