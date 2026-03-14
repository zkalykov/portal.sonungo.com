'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

type AuthStatus = 'loading' | 'success' | 'error';

export default function AuthCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // If already authenticated, just redirect
    if (isAuthenticated) {
      router.replace('/');
      return;
    }

    async function exchangeCode() {
      try {
        const response = await fetch('/api/auth/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Unknown error' }));
          setErrorMessage(error.error || error.detail || `Authentication failed (${response.status})`);
          setStatus('error');
          return;
        }

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          // Short delay so user sees success, then full reload to trigger strictly server-side re-hydration
          setTimeout(() => {
            window.location.href = '/';
          }, 1200);
        } else {
          setErrorMessage('Invalid response from authentication server');
          setStatus('error');
        }
      } catch (err) {
        console.error('Auth exchange error:', err);
        setErrorMessage('Could not connect to authentication server. Please try again.');
        setStatus('error');
      }
    }

    exchangeCode();
  }, [code, isAuthenticated, login, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="max-w-md w-full mx-4">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                Authenticating...
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-green-600">Authenticated!</span>
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-600">Authentication Failed</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'loading' && (
            <p className="text-sm text-muted-foreground">
              Exchanging your auth code with the server...
            </p>
          )}
          {status === 'success' && (
            <p className="text-sm text-muted-foreground">
              Redirecting you to the dashboard...
            </p>
          )}
          {status === 'error' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
              <a
                href="https://t.me/canvas_sonungo_com_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors"
              >
                Get a new auth link from the Telegram bot →
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
