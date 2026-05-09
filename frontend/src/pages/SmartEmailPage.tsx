import { useEffect, useState } from 'react';
import { Mail, Star, Calendar, CheckSquare, Sparkles, Clock, Loader2 } from 'lucide-react';
import { apiUrl } from '../lib/api';
import { useAuth } from '../app/context/AuthContext';
import GoogleIntegrationIndicator from '../components/GoogleIntegrationIndicator';

interface Email {
  id: string;
  from: string;
  subject: string;
  preview: string;
  time: string;
  read: boolean;
  starred: boolean;
  aiSummary?: string;
}

export default function SmartEmailPage() {
  const { user } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [draftReply, setDraftReply] = useState('');
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [fetchingSummary, setFetchingSummary] = useState(false);

  const loadEmails = async () => {
    setLoading(true);
    setError('');
    try {
      const emailQuery = user?.email ? `?email=${encodeURIComponent(user.email)}` : '';
      const res = await fetch(`${apiUrl('/emails')}${emailQuery}`);
      const data = await res.json();
      if (!res.ok) {
        setIsGoogleConnected(Boolean(data?.connected));
        throw new Error(data?.detail || 'Failed to fetch emails');
      }
      setIsGoogleConnected(Boolean(data?.connected));
      const mapped: Email[] = ((data?.emails || []) as any[]).map((item: any) => ({
        id: String(item.id),
        from: String(item.from || 'Unknown sender'),
        subject: String(item.subject || 'No subject'),
        preview: String(item.preview || ''),
        time: new Date(item.receivedAt || Date.now()).toLocaleString(),
        read: Boolean(item.read),
        starred: Boolean(item.starred),
        aiSummary: String(item.preview || '').slice(0, 140) || 'No preview available for this email.',
      }));
      setEmails(mapped);
      setSelectedEmail((prev) => mapped.find((m) => m.id === prev?.id) || mapped[0] || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load emails');
      setEmails([]);
      setSelectedEmail(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, [user?.email]);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!selectedEmail) return;
      
      // If we already have a real summary (not just the fallback snippet), don't refetch
      // We can distinguish it by checking if it ends exactly like a fallback, but let's just 
      // always fetch it for now, and update it in the state.
      // A better way is to check if it's already fetched.
      if (selectedEmail.aiSummary && selectedEmail.aiSummary !== (selectedEmail.preview.slice(0, 140) || 'No preview available for this email.')) {
        return;
      }

      setFetchingSummary(true);
      try {
        const res = await fetch(apiUrl(`/emails/${selectedEmail.id}/summary`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            snippet: selectedEmail.preview,
            subject: selectedEmail.subject,
            from: selectedEmail.from,
          }),
        });
        const data = await res.json();
        
        // Update the email in the list and the selected email
        if (data.summary) {
          const newSummary = data.summary;
          setEmails(prev => prev.map(e => e.id === selectedEmail.id ? { ...e, aiSummary: newSummary } : e));
          setSelectedEmail(prev => prev?.id === selectedEmail.id ? { ...prev, aiSummary: newSummary } : prev);
        }
      } catch (err) {
        console.error("Failed to fetch summary:", err);
      } finally {
        setFetchingSummary(false);
      }
    };
    
    fetchSummary();
  }, [selectedEmail?.id]);

  const toggleStar = async () => {
    if (!selectedEmail) return;
    setActionLoading(true);
    try {
      const nextStar = !selectedEmail.starred;
      await fetch(apiUrl(`/emails/${selectedEmail.id}/star`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: nextStar, email: user?.email || '' }),
      });
      setEmails((prev) => prev.map((e) => (e.id === selectedEmail.id ? { ...e, starred: nextStar } : e)));
      setSelectedEmail({ ...selectedEmail, starred: nextStar });
    } finally {
      setActionLoading(false);
    }
  };

  const markRead = async (read = true) => {
    if (!selectedEmail) return;
    setActionLoading(true);
    try {
      await fetch(apiUrl(`/emails/${selectedEmail.id}/mark-read`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read, email: user?.email || '' }),
      });
      setEmails((prev) => prev.map((e) => (e.id === selectedEmail.id ? { ...e, read } : e)));
      setSelectedEmail({ ...selectedEmail, read });
    } finally {
      setActionLoading(false);
    }
  };

  const addToCalendar = async () => {
    if (!selectedEmail) return;
    setActionLoading(true);
    setError('');
    try {
      const start = new Date(Date.now() + 2 * 3600 * 1000);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      const res = await fetch(apiUrl('/calendar/events'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Follow up: ${selectedEmail.subject}`,
          start_at: start.toISOString(),
          end_at: end.toISOString(),
          location: '',
          also_create_google: true,
          email: user?.email || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'Failed to add event');
      setError('Added a follow-up event to calendar.');
    } catch (err: any) {
      setError(err.message || 'Failed to add calendar event');
    } finally {
      setActionLoading(false);
    }
  };

  const generateDraft = async () => {
    if (!selectedEmail) return;
    setActionLoading(true);
    setDraftReply('');
    try {
      const res = await fetch(apiUrl(`/emails/${selectedEmail.id}/draft-reply`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Draft a concise reply to "${selectedEmail.subject}" from ${selectedEmail.from}.`,
          email: user?.email || '',
        }),
      });
      const data = await res.json();
      setDraftReply(String(data?.draft || ''));
    } finally {
      setActionLoading(false);
    }
  };

  const unreadCount = emails.filter(email => !email.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <Mail className="w-10 h-10" />
          <h1 className="text-4xl font-bold">Smart Email Assistant</h1>
        </div>
        <p className="text-lg text-white/90">AI-powered email management with smart summaries</p>
      </div>
      <GoogleIntegrationIndicator />

      {/* Email Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card backdrop-blur-sm rounded-xl p-4 shadow-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/80/20">
              <Mail className="w-5 h-5 text-primary/80" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{emails.length}</p>
              <p className="text-sm text-muted-foreground">Total Emails</p>
            </div>
          </div>
        </div>
        <div className="bg-card backdrop-blur-sm rounded-xl p-4 shadow-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{unreadCount}</p>
              <p className="text-sm text-muted-foreground">Unread</p>
            </div>
          </div>
        </div>
        <div className="bg-card backdrop-blur-sm rounded-xl p-4 shadow-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary-warn/20">
              <Star className="w-5 h-5 text-secondary-warn" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{emails.filter(e => e.starred).length}</p>
              <p className="text-sm text-muted-foreground">Starred</p>
            </div>
          </div>
        </div>
        <div className="bg-card backdrop-blur-sm rounded-xl p-4 shadow-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Sparkles className="w-5 h-5 text-primary/80" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">AI</p>
              <p className="text-sm text-muted-foreground">Powered</p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email List */}
        <div className="lg:col-span-1 bg-card backdrop-blur-sm rounded-2xl shadow-lg border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-bold text-lg text-foreground">Inbox</h3>
            {loading && <p className="text-xs text-muted-foreground mt-1">Loading...</p>}
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {!loading && !emails.length && (
              <div className="p-4 text-sm text-muted-foreground">
                {isGoogleConnected
                  ? 'No Gmail messages found for this account.'
                  : 'Connect Google in Settings to load your real Gmail inbox.'}
              </div>
            )}
            {emails.map((email) => (
              <div
                key={email.id}
                onClick={() => setSelectedEmail(email)}
                className={`p-4 cursor-pointer transition-all hover:bg-background ${
                  selectedEmail?.id === email.id ? 'bg-background' : ''
                } ${!email.read ? 'border-l-4 border-primary' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-semibold text-sm ${!email.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {email.from}
                      </p>
                      {email.starred && <Star className="w-4 h-4 text-secondary-warn fill-current" />}
                    </div>
                    <p className={`text-sm mb-1 ${!email.read ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {email.subject}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{email.preview}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{email.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Email Detail */}
        <div className="lg:col-span-2 space-y-4">
          {selectedEmail ? (
            <>
              {/* Email Header */}
              <div className="bg-card backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2 text-foreground">{selectedEmail.subject}</h2>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">From: {selectedEmail.from}</span>
                      <span>•</span>
                      <span>{selectedEmail.time}</span>
                    </div>
                  </div>
                  <button onClick={toggleStar} disabled={actionLoading} className="p-2 rounded-lg hover:bg-background transition-all disabled:opacity-50">
                    <Star
                      className={`w-5 h-5 ${
                        selectedEmail.starred ? 'text-secondary-warn fill-current' : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                </div>

                {/* AI Summary */}
                <div className="bg-gradient-to-br from-primary/20 to-primary/80/20 rounded-xl p-4 border border-primary/30">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary/80 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold mb-1 text-foreground">AI Summary</p>
                      {fetchingSummary ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                        </div>
                      ) : (
                        <p className="text-sm text-foreground">{selectedEmail.aiSummary}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Email Body */}
                <div className="mt-6">
                  <p className="text-muted-foreground leading-relaxed">{selectedEmail.preview}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-card backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border">
                <h3 className="font-bold text-lg mb-4 text-foreground">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => markRead(true)} disabled={actionLoading} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-background text-foreground hover:bg-card border border-border transition-all disabled:opacity-50">
                    <CheckSquare className="w-5 h-5" />
                    <span>Mark as Read</span>
                  </button>
                  <button onClick={addToCalendar} disabled={actionLoading} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50">
                    <Calendar className="w-5 h-5" />
                    <span>Add to Calendar</span>
                  </button>
                </div>
                <button onClick={generateDraft} disabled={actionLoading} className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-background text-foreground border border-border hover:bg-card disabled:opacity-50">
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Reply Draft</span>
                </button>
                {draftReply && (
                  <div className="mt-3 p-3 rounded-xl bg-background border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Draft Reply</p>
                    <p className="text-sm text-foreground">{draftReply}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-card backdrop-blur-sm rounded-2xl p-12 text-center shadow-lg border border-border">
              <Mail className="w-16 h-16 text-border mx-auto mb-4" />
              <p className="text-xl text-muted-foreground">Select an email to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
