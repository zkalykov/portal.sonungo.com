'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { canvasApi } from '@/lib/canvas-api';
import type { Assignment } from '@/lib/types';
import { UploadCloud, Link as LinkIcon, Type, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface AssignmentSubmissionProps {
  assignment: Assignment;
  onSuccess?: () => void;
}

export function AssignmentSubmission({ assignment, onSuccess }: AssignmentSubmissionProps) {
  const [activeTab, setActiveTab] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Form states
  const [textEntry, setTextEntry] = useState('');
  const [urlEntry, setUrlEntry] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Available submission types from Canvas
  const hasTextEntry = assignment.submission_types?.includes('online_text_entry');
  const hasUrl = assignment.submission_types?.includes('online_url');
  const hasUpload = assignment.submission_types?.includes('online_upload');

  // Set initial tab
  if (!activeTab) {
    if (hasUpload) setActiveTab('upload');
    else if (hasTextEntry) setActiveTab('text');
    else if (hasUrl) setActiveTab('url');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      if (activeTab === 'upload') {
        if (!selectedFile) throw new Error('Please select a file to upload');
        const fileId = await canvasApi.uploadFile(assignment.course_id, assignment.id, selectedFile);
        if (!fileId) throw new Error('File upload failed to return a file ID');
        
        await canvasApi.submitAssignment(assignment.course_id, assignment.id, {
          submission_type: 'online_upload',
          file_ids: [fileId]
        });
      } else if (activeTab === 'text') {
        if (!textEntry.trim()) throw new Error('Please enter your submission text');
        await canvasApi.submitAssignment(assignment.course_id, assignment.id, {
          submission_type: 'online_text_entry',
          body: textEntry
        });
      } else if (activeTab === 'url') {
        if (!urlEntry.trim()) throw new Error('Please enter a valid URL');
        await canvasApi.submitAssignment(assignment.course_id, assignment.id, {
          submission_type: 'online_url',
          url: urlEntry
        });
      }

      setSuccess(true);
      setTextEntry('');
      setUrlEntry('');
      setSelectedFile(null);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasTextEntry && !hasUrl && !hasUpload) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-sm text-center">
            This assignment does not accept online submissions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6 border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg">Submit Assignment</CardTitle>
        <CardDescription>Choose a submission method below</CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="flex flex-col items-center justify-center py-6 text-green-600 dark:text-green-400 space-y-3">
            <CheckCircle2 className="h-12 w-12" />
            <p className="font-semibold text-lg">Submission Successful!</p>
            <Button variant="outline" onClick={() => setSuccess(false)} className="mt-4">
              Submit Another
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full mb-4" style={{ gridTemplateColumns: `repeat(${[hasUpload, hasTextEntry, hasUrl].filter(Boolean).length}, 1fr)` }}>
              {hasUpload && (
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <UploadCloud className="h-4 w-4" /> File Upload
                </TabsTrigger>
              )}
              {hasTextEntry && (
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <Type className="h-4 w-4" /> Text Entry
                </TabsTrigger>
              )}
              {hasUrl && (
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" /> Website URL
                </TabsTrigger>
              )}
            </TabsList>

            <form onSubmit={handleSubmit}>
              {hasUpload && (
                <TabsContent value="upload" className="space-y-4">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Input 
                      id="file-upload" 
                      type="file" 
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="cursor-pointer file:cursor-pointer file:bg-primary/10 file:text-primary file:border-0 file:mr-4 file:py-2 file:px-4 file:rounded-md hover:file:bg-primary/20"
                    />
                  </div>
                </TabsContent>
              )}

              {hasTextEntry && (
                <TabsContent value="text" className="space-y-4">
                  <textarea
                    value={textEntry}
                    onChange={(e) => setTextEntry(e.target.value)}
                    placeholder="Type your submission here..."
                    className="flex min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </TabsContent>
              )}

              {hasUrl && (
                <TabsContent value="url" className="space-y-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Input 
                      type="url" 
                      placeholder="https://example.com" 
                      value={urlEntry}
                      onChange={(e) => setUrlEntry(e.target.value)}
                    />
                  </div>
                </TabsContent>
              )}

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm mt-4 p-3 bg-destructive/10 rounded-md">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Assignment'
                )}
              </Button>
            </form>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
