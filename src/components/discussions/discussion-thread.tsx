'use client';

import { useState, useEffect } from 'react';
import { canvasApi } from '@/lib/canvas-api';
import type { DiscussionTopic, DiscussionEntry } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Reply, MessageSquare } from 'lucide-react';

interface DiscussionThreadProps {
  topic: DiscussionTopic;
}

export function DiscussionThread({ topic }: DiscussionThreadProps) {
  const [entries, setEntries] = useState<DiscussionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const data = await canvasApi.getDiscussionEntries(topic.course_id, topic.id);
      setEntries(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load discussion thread');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [topic.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6 text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="border-b pb-6 mb-6">
        <div 
          className="prose prose-sm dark:prose-invert max-w-none break-words"
          dangerouslySetInnerHTML={{ __html: topic.message }}
        />
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" /> 
          Replies ({entries.length})
        </h3>
        
        {/* Main Reply Box */}
        <ReplyBox 
          courseId={topic.course_id} 
          topicId={topic.id} 
          onSuccess={fetchEntries} 
        />

        {entries.length === 0 ? (
          <p className="text-muted-foreground text-sm italic pt-4">No replies yet. Be the first!</p>
        ) : (
          <div className="space-y-6 mt-8">
            {entries.map(entry => (
              <DiscussionEntryNode 
                key={entry.id} 
                entry={entry} 
                courseId={topic.course_id} 
                topicId={topic.id}
                onRefresh={fetchEntries}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DiscussionEntryNode({ 
  entry, 
  courseId, 
  topicId, 
  onRefresh,
  depth = 0 
}: { 
  entry: DiscussionEntry; 
  courseId: number; 
  topicId: number; 
  onRefresh: () => void;
  depth?: number;
}) {
  const [isReplying, setIsReplying] = useState(false);

  const isDeleted = entry.message === null || entry.message === undefined || entry.message.trim() === '';

  return (
    <div className={`flex gap-3 pt-2 ${depth > 0 ? 'mt-4 border-l-2 pl-4 ml-2 border-primary/10' : ''}`}>
      <Avatar className="h-8 w-8 mt-1 shrink-0">
        <AvatarImage src={entry.user?.avatar_image_url} />
        <AvatarFallback>{entry.user_name?.charAt(0) || '?'}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{entry.user_name || 'Anonymous User'}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(entry.created_at || new Date()), { addSuffix: true })}
          </span>
        </div>

        {isDeleted ? (
          <p className="text-sm italic text-muted-foreground bg-muted p-2 rounded-md">
            This message was deleted.
          </p>
        ) : (
          <div 
            className="text-sm prose prose-sm dark:prose-invert max-w-none break-words bg-muted/30 p-3 rounded-md mb-2"
            dangerouslySetInnerHTML={{ __html: entry.message }}
          />
        )}

        {!isDeleted && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-xs px-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsReplying(!isReplying)}
          >
            <Reply className="h-3 w-3 mr-1" />
            Reply
          </Button>
        )}

        {isReplying && (
          <div className="mt-2 mb-4">
            <ReplyBox 
              courseId={courseId} 
              topicId={topicId} 
              entryId={entry.id} 
              onSuccess={() => {
                setIsReplying(false);
                onRefresh();
              }} 
            />
          </div>
        )}

        {entry.replies && entry.replies.length > 0 && (
          <div className="mt-2 space-y-4">
            {entry.replies.map(reply => (
              <DiscussionEntryNode 
                key={reply.id} 
                entry={reply} 
                courseId={courseId} 
                topicId={topicId} 
                onRefresh={onRefresh}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReplyBox({ 
  courseId, 
  topicId, 
  entryId, 
  onSuccess 
}: { 
  courseId: number; 
  topicId: number; 
  entryId?: number; 
  onSuccess: () => void; 
}) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    
    try {
      setSubmitting(true);
      setError(null);
      await canvasApi.postDiscussionReply(courseId, topicId, message, entryId);
      setMessage('');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2 mt-2 border rounded-md p-3 bg-background">
      <textarea
        className="w-full min-h-[80px] bg-transparent text-sm resize-y outline-none placeholder:text-muted-foreground"
        placeholder={entryId ? "Write a reply..." : "Start a new thread..."}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={submitting}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Button 
          size="sm" 
          onClick={handleSubmit} 
          disabled={!message.trim() || submitting}
        >
          {submitting ? (
            <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Posting...</>
          ) : (
            'Post Reply'
          )}
        </Button>
      </div>
    </div>
  );
}
