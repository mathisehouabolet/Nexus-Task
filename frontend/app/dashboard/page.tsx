"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutGrid,
  Briefcase,
  Users,
  HelpCircle,
  LogOut,
  Bell,
  Settings,
  Zap,
  MessageCircle,
  AlertCircle,
  Plus,
  Check,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import type { AppLocale } from '@/context/PreferencesContext';
import { API_BASE, authHeaders } from '@/lib/api';
import { dashboardT } from '@/lib/dashboard-i18n';
import { openSupportEmail } from '@/lib/support';
import { ProgressBar } from '@/components/dashboard/ProgressBar';
import { StatCard } from '@/components/dashboard/StatCard';
import { NewTaskModal } from '@/components/dashboard/NewTaskModal';
import { EditTaskModal } from '@/components/dashboard/EditTaskModal';
import { SettingsDrawer } from '@/components/dashboard/SettingsDrawer';
import { dashboardSkin } from '@/lib/dashboard-theme';

type Summary = {
  totalTasks: number;
  completed: number;
  inProgress: number;
  toDo: number;
  completedPercent: number;
  performanceScore: number | null;
  remainingToday: number;
  trends: { total: number | null; inProgress: number | null };
};

type FocusTask = {
  _id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  project_name: string;
  assigned_users: Array<{
    _id: string;
    nom: string;
    prenom: string;
    avatar_url?: string;
  }>;
} | null;

type ActivityRow = {
  _id: string;
  action_type: string;
  target_item_name: string;
  department: string;
  createdAt: string;
  user: { nom: string; prenom: string; avatar_url?: string };
};

type TeamMember = {
  _id: string;
  nom: string;
  prenom: string;
  job_role: string;
  avatar_url?: string;
  is_online: boolean;
};

type TaskItem = {
  _id: string;
  title: string;
  status: string;
  priority: string;
  project_name?: string;
  description?: string;
  department?: string;
  due_date: string | null;
};

function formatRelativeTime(iso: string, locale: AppLocale) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return dashboardT(locale, 'timeJustNow');
  if (s < 3600) return dashboardT(locale, 'timeMinAgo', { n: Math.floor(s / 60) });
  if (s < 86400) {
    return dashboardT(locale, 'timeHoursAgo', { n: Math.floor(s / 3600) });
  }
  return dashboardT(locale, 'timeDaysAgo', { n: Math.floor(s / 86400) });
}

function formatDueIn(due: string | null, locale: AppLocale) {
  if (!due) return '';
  const ms = new Date(due).getTime() - Date.now();
  if (ms < 0) return dashboardT(locale, 'overdue');
  const h = Math.ceil(ms / 3600000);
  if (h < 48) return dashboardT(locale, 'dueIn', { h });
  const d = Math.ceil(ms / 86400000);
  return dashboardT(locale, 'dueInDays', { d });
}

function activityMessage(a: ActivityRow, locale: AppLocale) {
  const name = `${a.user.prenom} ${a.user.nom}`;
  const item = a.target_item_name;
  switch (a.action_type) {
    case 'created':
      return dashboardT(locale, 'actCreated', { name, item });
    case 'updated':
      return dashboardT(locale, 'actUpdated', { name, item });
    case 'completed':
      return dashboardT(locale, 'actCompleted', { name, item });
    case 'commented':
      return dashboardT(locale, 'actCommented', { name, item });
    case 'reported':
      return dashboardT(locale, 'actReported', { item });
    default:
      return dashboardT(locale, 'actFallback', { name, item });
  }
}

function overviewCopy(locale: AppLocale, summary: Summary, focus: FocusTask) {
  if (summary.totalTasks === 0) {
    return dashboardT(locale, 'overviewEmpty');
  }
  let s = dashboardT(locale, 'overviewTasksToday', { n: summary.remainingToday });
  if (focus?.project_name) {
    s += dashboardT(locale, 'overviewFocusProject', { project: focus.project_name });
  }
  return s;
}

function initials(prenom: string, nom: string) {
  const a = (prenom?.[0] || '') + (nom?.[0] || '');
  return a.toUpperCase() || '?';
}

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, loading: authLoading } = useAuth();
  const { locale, theme, setLocale, setTheme } = usePreferences();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [focus, setFocus] = useState<FocusTask>(null);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [clearingActivityHistory, setClearingActivityHistory] = useState(false);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loadError, setLoadError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [patchingTaskId, setPatchingTaskId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [taskStatusFilter, setTaskStatusFilter] = useState<
    'all' | 'To Do' | 'In Progress' | 'Completed'
  >('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const token = user?.token ?? '';

  const refreshAll = useCallback(async () => {
    if (!user?.token) return;
    setLoadError('');
    try {
      const h = authHeaders(user.token);
      const [sRes, fRes, aRes, tRes, tasksRes] = await Promise.all([
        fetch(`${API_BASE}/api/dashboard/summary`, { headers: h }),
        fetch(`${API_BASE}/api/dashboard/focus-task`, { headers: h }),
        fetch(`${API_BASE}/api/activities`, { headers: h }),
        fetch(`${API_BASE}/api/team/active`, { headers: h }),
        fetch(`${API_BASE}/api/tasks`, { headers: h }),
      ]);
      if (!sRes.ok) {
        const err = await sRes.json().catch(() => ({} as { message?: string }));
        throw new Error(err.message ? `Summary: ${err.message}` : `Failed to load summary (${sRes.status})`);
      }
      setSummary(await sRes.json());
      const focusData = fRes.ok ? await fRes.json() : null;
      setFocus(focusData && focusData._id ? focusData : null);
      setActivities(aRes.ok ? await aRes.json() : []);
      setTeam(tRes.ok ? await tRes.json() : []);
      const list: TaskItem[] = tasksRes.ok ? await tasksRes.json() : [];
      const sorted = [...list].sort((a, b) => {
        const ac = a.status === 'Completed' ? 1 : 0;
        const bc = b.status === 'Completed' ? 1 : 0;
        if (ac !== bc) return ac - bc;
        return 0;
      });
      setTasks(sorted);
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : 'Load failed');
    }
  }, [user?.token]);

  const clearActivityHistory = async () => {
    if (!user?.token || clearingActivityHistory) return false;
    setClearingActivityHistory(true);
    try {
      const res = await fetch(`${API_BASE}/api/activities`, {
        method: 'DELETE',
        headers: authHeaders(user.token),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Clear activity failed');
      }
      setActivities([]);
      return true;
    } catch (e: unknown) {
      window.alert(e instanceof Error ? e.message : 'Clear activity failed');
      return false;
    } finally {
      setClearingActivityHistory(false);
    }
  };

  const toggleTaskComplete = async (task: TaskItem) => {
    if (!user?.token || patchingTaskId) return;
    const nextStatus = task.status === 'Completed' ? 'To Do' : 'Completed';
    setPatchingTaskId(task._id);
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${task._id}`, {
        method: 'PATCH',
        headers: authHeaders(user.token),
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Update failed');
      }
      await refreshAll();
    } catch {
      /* keep UI; refreshAll on success only */
    } finally {
      setPatchingTaskId(null);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (taskStatusFilter !== 'all' && task.status !== taskStatusFilter) return false;
      return true;
    });
  }, [tasks, taskStatusFilter]);

  const deleteTaskRequest = async (task: TaskItem) => {
    if (!user?.token || deletingId) return;
    const ok =
      typeof window !== 'undefined' &&
      window.confirm(dashboardT(locale, 'confirmDelete', { title: task.title }));
    if (!ok) return;
    setDeletingId(task._id);
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${task._id}`, {
        method: 'DELETE',
        headers: authHeaders(user.token),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Delete failed');
      }
      await refreshAll();
    } catch {
      /* ignore */
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (task: TaskItem) => {
    setEditingTask(task);
    setEditOpen(true);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user?.token) refreshAll();
  }, [user?.token, refreshAll]);

  useEffect(() => {
    if (!user?.token) return;
    const intervalId = window.setInterval(() => {
      fetch(`${API_BASE}/api/team/active`, { headers: authHeaders(user.token) })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setTeam(Array.isArray(data) ? data : []))
        .catch(() => {});
    }, 20_000);
    return () => window.clearInterval(intervalId);
  }, [user?.token]);

  const startSession = async () => {
    if (!user?.token || !focus?._id) return;
    setSessionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${focus._id}`, {
        method: 'PATCH',
        headers: authHeaders(user.token),
        body: JSON.stringify({ status: 'In Progress' }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed');
      }
      await refreshAll();
    } catch {
      /* ignore */
    } finally {
      setSessionLoading(false);
    }
  };

  const t = (key: string, vars?: Record<string, string | number>) =>
    dashboardT(locale, key, vars);

  if (authLoading || !user) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center font-[Inter,system-ui,sans-serif] ${
          theme === 'light' ? 'bg-slate-100 text-slate-500' : 'bg-[#0a0e17] text-slate-400'
        }`}
      >
        {dashboardT(locale, 'loading')}
      </div>
    );
  }

  const jobLabel = user.job_role?.trim() || String(user.role || 'member').toUpperCase();
  const s = dashboardSkin(theme);
  const isLight = theme === 'light';

  return (
    <div className={`min-h-screen flex font-[Inter,system-ui,sans-serif] ${s.page}`}>
      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        locale={locale}
        setLocale={setLocale}
        theme={theme}
        setTheme={setTheme}
        onClearActivityHistory={clearActivityHistory}
        clearingActivityHistory={clearingActivityHistory}
        onOpenProfile={() => {
          setSettingsOpen(false);
          router.push('/profile');
        }}
      />
      <EditTaskModal
        open={editOpen}
        token={token}
        task={
          editingTask
            ? {
                _id: editingTask._id,
                title: editingTask.title,
                description: editingTask.description,
                project_name: editingTask.project_name,
                department: editingTask.department,
                status: editingTask.status,
                priority: editingTask.priority,
                due_date: editingTask.due_date,
              }
            : null
        }
        onClose={() => {
          setEditOpen(false);
          setEditingTask(null);
        }}
        onSaved={refreshAll}
        light={isLight}
      />
      <NewTaskModal
        open={modalOpen}
        token={token}
        onClose={() => setModalOpen(false)}
        onCreated={refreshAll}
      />

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 flex lg:hidden bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className={`w-[280px] h-full flex flex-col py-8 px-5 ${s.aside}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-2 mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#7c5cfc] flex items-center justify-center">
                  <LayoutGrid className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className={`font-bold text-lg leading-tight ${s.heading}`}>Nexus Task</p>
                  <p className={`text-[10px] font-bold tracking-[0.2em] ${s.muted}`}>
                    {t('workspace')}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setMobileMenuOpen(false)}
                className={`p-2 rounded-xl ${s.iconBtn}`}
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <nav className="space-y-1 flex-1">
              {[
                { icon: LayoutGrid, labelKey: 'navDashboard' as const, href: '/dashboard', active: pathname === '/dashboard' },
                { icon: Briefcase, labelKey: 'navBackoffice' as const, href: '/dashboard/backoffice', active: pathname?.startsWith('/dashboard/backoffice') },
                { icon: Users, labelKey: 'navTeam' as const, href: '/dashboard/team', active: pathname?.startsWith('/dashboard/team') },
              ].map(({ icon: Icon, labelKey, href, active }) => (
                <Link
                  key={labelKey}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active ? s.navActive : s.navInactive
                  }`}
                >
                  <Icon className="w-5 h-5 opacity-80" />
                  {t(labelKey)}
                </Link>
              ))}
            </nav>

            <button
              type="button"
              onClick={() => { setModalOpen(true); setMobileMenuOpen(false); }}
              className="mt-6 w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#3b82f6] to-[#7c5cfc] hover:opacity-95 shadow-lg shadow-[#3b82f6]/20"
            >
              {t('newTask')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                openSupportEmail(user.email, `${user.prenom} ${user.nom}`);
              }}
              className={`mt-3 flex items-center gap-3 px-3 py-2 text-sm w-full text-left ${s.helpHover}`}
            >
              <HelpCircle className="w-5 h-5 shrink-0" />
              {t('helpSupport')}
            </button>
            <button
              type="button"
              onClick={() => { logout(); router.push('/'); }}
              className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-red-400 text-sm w-full text-left"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {t('logOut')}
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`hidden lg:flex w-[260px] shrink-0 flex-col py-8 px-5 ${s.aside}`}>
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#7c5cfc] flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className={`font-bold text-lg leading-tight ${s.heading}`}>Nexus Task</p>
            <p className={`text-[10px] font-bold tracking-[0.2em] ${s.muted}`}>
              {t('workspace')}
            </p>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {[
            { icon: LayoutGrid, labelKey: 'navDashboard' as const, href: '/dashboard', active: pathname === '/dashboard' },
            { icon: Briefcase, labelKey: 'navBackoffice' as const, href: '/dashboard/backoffice', active: pathname?.startsWith('/dashboard/backoffice') },
            { icon: Users, labelKey: 'navTeam' as const, href: '/dashboard/team', active: pathname?.startsWith('/dashboard/team') },
          ].map(({ icon: Icon, labelKey, href, active }) => (
            <Link
              key={labelKey}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active ? s.navActive : s.navInactive
              }`}
            >
              <Icon className="w-5 h-5 opacity-80" />
              {t(labelKey)}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="mt-6 w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#3b82f6] to-[#7c5cfc] hover:opacity-95 shadow-lg shadow-[#3b82f6]/20"
        >
          {t('newTask')}
        </button>
        <button
          type="button"
          onClick={() =>
            openSupportEmail(user.email, `${user.prenom} ${user.nom}`)
          }
          className={`mt-3 flex items-center gap-3 px-3 py-2 text-sm w-full text-left ${s.helpHover}`}
        >
          <HelpCircle className="w-5 h-5 shrink-0" />
          {t('helpSupport')}
        </button>
        <button
          type="button"
          onClick={() => { logout(); router.push('/'); }}
          className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-red-400 text-sm w-full text-left"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {t('logOut')}
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className={`h-[72px] shrink-0 border-b flex items-center gap-4 px-4 md:px-8 ${s.border} ${s.header}`}>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className={`p-2 rounded-xl lg:hidden ${s.iconBtn}`}
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1" />
          <button type="button" className={`p-2 rounded-xl ${s.iconBtn}`}>
            <Bell className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className={`p-2 rounded-xl ${s.iconBtn}`}
            aria-label={t('settingsTitle')}
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => router.push('/profile')}
            className={`flex items-center gap-3 pl-4 border-l ${s.border} ${s.iconBtn} rounded-xl`}
            aria-label={t('editProfile')}
            title={t('editProfile')}
          >
            <div className="text-right hidden sm:block">
              <p className={`text-sm font-semibold ${s.heading}`}>
                {user.prenom} {user.nom}
              </p>
              <p className={`text-[10px] font-bold tracking-wider ${s.muted}`}>{jobLabel}</p>
            </div>
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar_url}
                alt=""
                className={`w-10 h-10 rounded-full object-cover border ${s.avatarBorder}`}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7c5cfc] to-[#3b82f6] flex items-center justify-center text-sm font-bold">
                {initials(user.prenom, user.nom)}
              </div>
            )}
          </button>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          {loadError && (
            <p className={`mb-4 text-sm rounded-xl px-4 py-2 ${s.loadWarn}`}>
              {loadError}
            </p>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            <section className={`xl:col-span-2 rounded-2xl p-6 md:p-8 ${s.border} ${theme === 'light' ? 'bg-white shadow-sm' : 'bg-[#0d1117]/60'}`}>
              <p className={`text-[10px] font-bold tracking-[0.2em] mb-2 ${s.muted}`}>
                {t('workspaceOverview')}
              </p>
              <h1 className={`text-3xl font-bold mb-3 ${s.heading}`}>
                {t('welcomeBack')}, {user.prenom}
              </h1>
              <p className={`${s.subtle} text-sm leading-relaxed max-w-2xl mb-8`}>
                {summary ? overviewCopy(locale, summary, focus) : '…'}
              </p>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-[0.15em] mb-2 ${s.muted}`}>
                  {t('tasksCompletedLabel')}
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <ProgressBar value={summary?.completedPercent ?? 0} light={isLight} />
                  </div>
                  <span className="text-lg font-bold text-[#7c5cfc] tabular-nums">
                    {summary
                      ? Math.round(summary.completedPercent)
                      : 0}
                    %
                  </span>
                </div>
                {summary && summary.totalTasks > 0 && (
                  <p className={`text-xs mt-2 ${s.muted}`}>
                    {t('tasksCountDone', {
                      done: summary.completed,
                      total: summary.totalTasks,
                    })}
                  </p>
                )}
              </div>
            </section>

            <section className={`rounded-2xl p-6 ${s.border} ${theme === 'light' ? 'bg-white shadow-sm' : 'bg-[#0d1117]/60'}`}>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-amber-400" />
                <h2 className={`font-bold text-lg ${s.heading}`}>{t('focusMode')}</h2>
              </div>
              <p className={`${s.muted} text-sm mb-4`}>
                {t('focusHint')}
              </p>
              {focus ? (
                <div className={`rounded-xl p-4 mb-4 ${s.border} ${theme === 'light' ? 'bg-slate-50' : 'bg-[#080b12]'}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <label className="relative flex shrink-0 mt-0.5 cursor-pointer group/check">
                      <input
                        type="checkbox"
                        checked={false}
                        disabled={!!patchingTaskId}
                        onChange={() =>
                          toggleTaskComplete({
                            _id: focus._id,
                            title: focus.title,
                            status: focus.status,
                            priority: focus.priority,
                            project_name: focus.project_name,
                            due_date: focus.due_date,
                          })
                        }
                        className="peer sr-only"
                        aria-label={t('focusCheckAria')}
                      />
                      <span className="flex h-5 w-5 items-center justify-center rounded-md border-2 border-slate-500 bg-transparent peer-focus-visible:ring-2 peer-focus-visible:ring-[#7c5cfc] peer-hover:border-[#7c5cfc] transition-colors" />
                    </label>
                    <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                      {focus.priority}
                    </span>
                    {focus.due_date && (
                      <span className={`text-xs ${s.muted}`}>
                        {formatDueIn(focus.due_date, locale)}
                      </span>
                    )}
                  </div>
                  <p className={`font-semibold mb-3 ${s.heading}`}>{focus.title}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {focus.assigned_users?.slice(0, 3).map((u) =>
                        u.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={u._id}
                            src={u.avatar_url}
                            alt=""
                            className={`w-8 h-8 rounded-full border-2 object-cover ${isLight ? 'border-slate-50' : 'border-[#080b12]'}`}
                          />
                        ) : (
                          <div
                            key={u._id}
                            className={`w-8 h-8 rounded-full border-2 bg-slate-600 flex items-center justify-center text-[10px] font-bold text-white ${isLight ? 'border-slate-50' : 'border-[#080b12]'}`}
                          >
                            {initials(u.prenom, u.nom)}
                          </div>
                        )
                      )}
                    </div>
                    <span className={`text-xs ${s.muted}`}>
                      {focus.assigned_users?.length
                        ? t('sharedWithTeam')
                        : t('unassigned')}
                    </span>
                  </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`rounded-xl border border-dashed p-6 text-center text-sm mb-4 ${s.dashedBox} ${s.muted}`}>
                  {t('noFocusTask')}
                </div>
              )}
              <button
                type="button"
                disabled={!focus || sessionLoading}
                onClick={startSession}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-sm hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sessionLoading ? t('starting') : t('startSession')}
              </button>
            </section>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <StatCard
              light={isLight}
              label={t('totalTasks')}
              value={summary?.totalTasks ?? 0}
              trend={
                summary?.trends?.total != null
                  ? { value: Math.abs(summary.trends.total), up: summary.trends.total >= 0 }
                  : undefined
              }
            />
            <StatCard
              light={isLight}
              label={t('completed')}
              value={summary?.completed ?? 0}
              sub={
                summary && summary.totalTasks > 0
                  ? `${summary.completedPercent}%`
                  : '—'
              }
            />
            <StatCard
              light={isLight}
              label={t('inProgress')}
              value={summary?.inProgress ?? 0}
              trend={
                summary?.trends?.inProgress != null
                  ? {
                      value: Math.abs(summary.trends.inProgress),
                      up: summary.trends.inProgress >= 0,
                    }
                  : undefined
              }
            />
            <StatCard
              light={isLight}
              label={t('performance')}
              value={summary?.performanceScore != null ? summary.performanceScore : '—'}
              {...(summary?.performanceScore != null
                ? {
                    stars: Math.min(5, Math.max(0, summary.performanceScore / 20)),
                  }
                : {})}
            />
          </div>

          <section className={`rounded-2xl p-6 mb-8 ${s.border} ${theme === 'light' ? 'bg-white shadow-sm' : 'bg-[#0d1117]/60'}`}>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className={`font-bold text-lg ${s.heading}`}>{t('myTasks')}</h2>
                <p className={`text-sm mt-1 ${s.muted}`}>{t('myTasksHint')}</p>
              </div>
              {tasks.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <label className="sr-only" htmlFor="task-filter-status">
                    {t('filterByStatus')}
                  </label>
                  <select
                    id="task-filter-status"
                    value={taskStatusFilter}
                    onChange={(e) =>
                      setTaskStatusFilter(
                        e.target.value as 'all' | 'To Do' | 'In Progress' | 'Completed'
                      )
                    }
                    className={`h-10 px-3 rounded-xl text-sm min-w-[140px] ${s.input}`}
                  >
                    <option value="all">{t('filterAll')}</option>
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              )}
            </div>
            {tasks.length === 0 ? (
              <p className={`text-sm py-10 text-center border border-dashed rounded-xl ${s.muted} ${s.border} ${s.dashedBox}`}>
                {t('noTasksYet')}
              </p>
            ) : filteredTasks.length === 0 ? (
              <p className={`text-sm py-10 text-center border border-dashed rounded-xl ${s.muted} ${s.border} ${s.dashedBox}`}>
                {t('filterNoResults')}
              </p>
            ) : (
              <ul className={`divide-y ${s.divide}`}>
                {filteredTasks.map((task) => {
                  const done = task.status === 'Completed';
                  const busy = patchingTaskId === task._id || deletingId === task._id;
                  return (
                    <li key={task._id} className="flex items-start gap-2 py-3 first:pt-0">
                      <label className="flex flex-1 min-w-0 cursor-pointer gap-3 group">
                        <input
                          type="checkbox"
                          checked={done}
                          disabled={!!patchingTaskId || !!deletingId}
                          onChange={() => toggleTaskComplete(task)}
                          className="peer sr-only"
                          aria-label={done ? t('taskCheckUndo') : t('taskCheckDone')}
                        />
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-[#7c5cfc] ${
                            done
                              ? 'border-emerald-500 bg-emerald-500'
                              : 'border-slate-500 bg-transparent group-hover:border-[#7c5cfc]'
                          } ${busy ? 'opacity-50' : ''}`}
                        >
                          <Check
                            className={`h-3 w-3 text-white stroke-[3] transition-all ${
                              done ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                            }`}
                          />
                        </span>
                        <span className="min-w-0 flex-1 pt-0.5">
                          <span
                            className={`font-medium text-sm block ${
                              done ? `${s.taskDoneText} line-through` : s.taskTitle
                            }`}
                          >
                            {task.title}
                          </span>
                          <span className={`text-xs mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 ${s.muted}`}>
                            {task.project_name ? <span>{task.project_name}</span> : null}
                            <span>{task.priority}</span>
                            {task.due_date ? (
                              <span>{formatDueIn(task.due_date, locale)}</span>
                            ) : null}
                          </span>
                        </span>
                      </label>
                      <div className="flex shrink-0 gap-1 pt-0.5">
                        <button
                          type="button"
                          onClick={() => openEdit(task)}
                          disabled={!!deletingId}
                          className={`p-2 rounded-lg transition-colors ${s.iconBtn}`}
                          title={t('editTask')}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTaskRequest(task)}
                          disabled={!!deletingId}
                          className="p-2 rounded-lg text-slate-500 hover:bg-red-500/15 hover:text-red-400 disabled:opacity-40"
                          title={t('deleteTask')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <section className={`rounded-2xl p-6 ${s.border} ${theme === 'light' ? 'bg-white shadow-sm' : 'bg-[#0d1117]/60'}`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`font-bold text-lg ${s.heading}`}>{t('recentActivity')}</h2>
                <button
                  type="button"
                  disabled={activities.length === 0 || clearingActivityHistory}
                  onClick={async () => {
                    const ok = window.confirm(t('confirmClearActivity'));
                    if (!ok) return;
                    await clearActivityHistory();
                  }}
                  className={`inline-flex items-center gap-2 text-xs rounded-lg px-3 py-1.5 border transition-colors ${
                    theme === 'light'
                      ? 'border-slate-200 text-red-600 hover:bg-slate-50'
                      : 'border-white/[0.10] text-red-400 hover:bg-white/[0.06]'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                  aria-label={t('clearActivity')}
                  title={t('clearActivity')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t('clearActivity')}
                </button>
              </div>
              {activities.length === 0 ? (
                <p className={`text-sm py-8 text-center border border-dashed rounded-xl ${s.muted} ${s.border} ${s.dashedBox}`}>
                  {t('noRecentActivity')}
                </p>
              ) : (
                <ul className="space-y-4">
                  {activities.map((a) => (
                    <li key={a._id} className="flex gap-3 text-sm">
                      <div
                        className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                          a.action_type === 'reported'
                            ? 'bg-red-500/15 text-red-400'
                            : `${isLight ? 'bg-slate-100 text-slate-500' : 'bg-white/[0.06] text-slate-400'}`
                        }`}
                      >
                        {a.action_type === 'reported' ? (
                          <AlertCircle className="w-4 h-4" />
                        ) : (
                          <LayoutGrid className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`leading-snug ${s.subtle}`}>
                          {activityMessage(a, locale)}
                        </p>
                        <p className={`text-xs mt-1 ${s.muted}`}>
                          {formatRelativeTime(a.createdAt, locale)}
                          {a.department ? ` • ${a.department}` : ''}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={`rounded-2xl p-6 relative ${s.border} ${theme === 'light' ? 'bg-white shadow-sm' : 'bg-[#0d1117]/60'}`}>
              <h2 className={`font-bold text-lg mb-6 ${s.heading}`}>{t('activeTeam')}</h2>
              {team.length === 0 ? (
                <p className={`text-sm py-8 text-center border border-dashed rounded-xl mb-4 ${s.muted} ${s.border} ${s.dashedBox}`}>
                  {t('noTeamOnline')}
                </p>
              ) : (
                <ul className="space-y-4 mb-6">
                  {team.map((m) => (
                    <li key={m._id} className="flex items-center gap-3">
                      <div className="relative">
                        {m.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.avatar_url}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                            {initials(m.prenom, m.nom)}
                          </div>
                        )}
                        {m.is_online && (
                          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ${s.teamOnlineRing}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${s.heading}`}>
                          {m.prenom} {m.nom}
                        </p>
                        <p className={`text-xs truncate ${s.muted}`}>
                          {m.job_role || t('member')}
                        </p>
                      </div>
                      <button
                        type="button"
                        className={`p-2 rounded-lg ${s.iconBtn}`}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-[#3b82f6] flex items-center justify-center shadow-lg shadow-[#3b82f6]/30 hover:scale-105 transition-transform"
              >
                <Plus className="w-6 h-6 text-white" />
              </button>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
