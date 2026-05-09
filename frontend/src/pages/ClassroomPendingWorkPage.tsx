import { useEffect, useState } from 'react';
import { CheckSquare, AlertCircle, Filter } from 'lucide-react';
import { Progress } from '../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { apiUrl } from '../lib/api';
import { useAuth } from '../app/context/AuthContext';
import GoogleIntegrationIndicator from '../components/GoogleIntegrationIndicator';

interface Task {
  id: string;
  category: string;
  title: string;
  dueAtIso: string | null;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  progress: number;
  description: string;
}

export default function ClassroomPendingWorkPage() {
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState('deadline');
  const [filterPriority, setFilterPriority] = useState('all');
  const [only2026, setOnly2026] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [progressDraftById, setProgressDraftById] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchPending = async () => {
      setLoading(true);
      setError('');
      try {
        const emailQuery = user?.email ? `?email=${encodeURIComponent(user.email)}` : '';
        const res = await fetch(`${apiUrl('/classroom/pending-work')}${emailQuery}`);
        const data = await res.json();
        if (!res.ok) {
          setIsGoogleConnected(false);
          throw new Error(data?.detail || 'Failed to load classroom work');
        }

        setIsGoogleConnected(Boolean(data?.connected));

        const mapped: Task[] = (data.items || []).map((item: any, index: number) => {
          const due = item?.dueDate ? new Date(item.dueDate) : null;
          const hasValidDue = Boolean(due && !Number.isNaN(due.getTime()));
          const daysLeft = hasValidDue ? Math.max(0, Math.ceil((due!.getTime() - Date.now()) / 86400000)) : null;
          const priority: Task['priority'] =
            daysLeft === null ? 'low' : daysLeft <= 2 ? 'high' : daysLeft <= 4 ? 'medium' : 'low';
          const progress =
            typeof item?.progress === 'number' ? item.progress : String(item.status || '').toLowerCase() === 'completed' ? 100 : 0;
          return {
            id: String(item.id || `cw-${index}`),
            category: String(item.course || 'Classroom'),
            title: String(item.title || 'Untitled coursework'),
            dueAtIso: hasValidDue ? due!.toISOString() : null,
            dueDate: hasValidDue ? due!.toLocaleDateString() : 'No due date',
            priority,
            progress,
            description: `Status: ${String(item.status || 'pending')}`,
          };
        });

        setTasks(mapped);
      } catch (err: any) {
        setError(err.message || 'Failed to load classroom work');
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, [user?.email]);

  const updateProgress = async (task: Task, nextProgress: number) => {
    if (!user?.email) return;
    if (!task.dueAtIso) {
      setError('Cannot update progress for items without a due date.');
      return;
    }
    setUpdatingId(task.id);
    setError('');
    try {
      const clamped = Math.max(0, Math.min(100, Math.round(Number(nextProgress) || 0)));
      const res = await fetch(apiUrl('/classroom/progress'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coursework_id: task.id,
          title: task.title,
          due_date: task.dueAtIso,
          progress: clamped,
          completed: clamped >= 100,
          email: user.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'Failed to update progress');
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, progress: clamped, description: `Status: ${clamped >= 100 ? 'completed' : 'pending'}` }
            : t
        )
      );
      setProgressDraftById((prev) => ({ ...prev, [task.id]: clamped }));
    } catch (err: any) {
      setError(err.message || 'Failed to update progress');
    } finally {
      setUpdatingId(null);
    }
  };
  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'medium':
        return 'bg-secondary-warn/20 text-secondary-warn border-secondary-warn/30';
      case 'low':
        return 'bg-primary/80/20 text-primary/80 border-primary/30';
      default:
        return 'bg-border/20 text-muted-foreground border-border/30';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Computer Science': 'bg-primary-hover',
      'Design': 'bg-primary',
      'Finance': 'bg-primary-active',
      'Health': 'bg-secondary-warn',
      'Learning': 'bg-secondary-warn',
      'Social': 'bg-destructive',
    };
    return colors[category] || 'bg-border';
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    // Always keep fully completed work at the bottom.
    const aDone = a.progress >= 100 ? 1 : 0;
    const bDone = b.progress >= 100 ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;

    if (sortBy === 'deadline') {
      const aTime = a.dueAtIso ? new Date(a.dueAtIso).getTime() : Number.POSITIVE_INFINITY;
      const bTime = b.dueAtIso ? new Date(b.dueAtIso).getTime() : Number.POSITIVE_INFINITY;
      return aTime - bTime;
    } else if (sortBy === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    } else if (sortBy === 'category') {
      return a.category.localeCompare(b.category);
    }
    return 0;
  });

  const filteredTasksByYear = only2026
    ? sortedTasks.filter((t) => t.dueAtIso && new Date(t.dueAtIso).getFullYear() === 2026)
    : sortedTasks;

  const filteredTasks = filterPriority === 'all'
    ? filteredTasksByYear
    : filteredTasksByYear.filter(a => a.priority === filterPriority);

  const stats = {
    total: tasks.length,
    high: tasks.filter(a => a.priority === 'high').length,
    medium: tasks.filter(a => a.priority === 'medium').length,
    low: tasks.filter(a => a.priority === 'low').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <CheckSquare className="w-10 h-10" />
          <h1 className="text-4xl font-bold">Google Classroom</h1>
        </div>
        <p className="text-lg text-white/90">Pending coursework from your connected Classroom account</p>
      </div>
      <GoogleIntegrationIndicator />

      {isGoogleConnected === false && !loading && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <p className="text-foreground font-semibold">Google Classroom isn’t connected.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Connect Google in Settings to load your real Classroom pending work.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card backdrop-blur-sm rounded-xl p-5 shadow-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Tasks</p>
            </div>
            <CheckSquare className="w-8 h-8 text-primary/80" />
          </div>
        </div>
        <div className="bg-card backdrop-blur-sm rounded-xl p-5 shadow-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-destructive">{stats.high}</p>
              <p className="text-sm text-muted-foreground mt-1">High Priority</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
          </div>
        </div>
        <div className="bg-card backdrop-blur-sm rounded-xl p-5 shadow-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-secondary-warn">{stats.medium}</p>
              <p className="text-sm text-muted-foreground mt-1">Medium Priority</p>
            </div>
            <AlertCircle className="w-8 h-8 text-secondary-warn" />
          </div>
        </div>
        <div className="bg-card backdrop-blur-sm rounded-xl p-5 shadow-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-primary/80">{stats.low}</p>
              <p className="text-sm text-muted-foreground mt-1">Low Priority</p>
            </div>
            <AlertCircle className="w-8 h-8 text-primary/80" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Sort & Filter:</span>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={only2026} onChange={(e) => setOnly2026(e.target.checked)} />
            Only 2026 deadlines
          </label>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48 rounded-xl bg-background border-border text-foreground">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="category">Category</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-48 rounded-xl bg-background border-border text-foreground">
              <SelectValue placeholder="Filter priority" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {loading && <p className="text-sm text-muted-foreground">Loading classroom tasks...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="bg-card backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:shadow-primary/10 transition-all border border-border group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-3 h-3 rounded-full ${getCategoryColor(task.category)}`}></div>
                  <span className="text-sm font-semibold text-primary/80">{task.category}</span>
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getPriorityBadgeColor(task.priority)}`}
                  >
                    {task.priority.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary/80 transition-colors">
                  {task.title}
                </h3>
                <p className="text-muted-foreground mb-3">{task.description}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold text-foreground">{task.progress}%</span>
              </div>
              <Progress value={task.progress} className="h-2" />
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4" />
                  <span>Due: {task.dueDate}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={progressDraftById[task.id] ?? task.progress}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setProgressDraftById((prev) => ({ ...prev, [task.id]: val }));
                    }}
                    className="flex-1 accent-primary"
                    style={{ accentColor: '#8B5CF6' }}
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={5}
                    value={progressDraftById[task.id] ?? task.progress}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setProgressDraftById((prev) => ({ ...prev, [task.id]: val }));
                    }}
                    className="w-20 h-10 rounded-lg bg-background border border-border px-2 text-foreground"
                  />
                  <button
                    onClick={() => updateProgress(task, progressDraftById[task.id] ?? task.progress)}
                    disabled={updatingId === task.id}
                    className="px-4 h-10 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white text-sm hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-60"
                  >
                    Save
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Set progress (0–100). Saved to DB.</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="bg-card backdrop-blur-sm rounded-2xl p-12 text-center shadow-lg border border-border">
          <CheckSquare className="w-16 h-16 text-border mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">
            {isGoogleConnected === false ? 'Connect Google to see your Classroom work.' : 'No pending Classroom work found.'}
          </p>
        </div>
      )}
    </div>
  );
}
