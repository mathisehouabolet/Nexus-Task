"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Briefcase,
  HelpCircle,
  LayoutGrid,
  LogOut,
  Plus,
  Save,
  Trash2,
  Users,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import type { AppLocale } from '@/context/PreferencesContext';
import { API_BASE, authHeaders } from '@/lib/api';
import { dashboardT } from '@/lib/dashboard-i18n';
import { dashboardSkin } from '@/lib/dashboard-theme';
import { openSupportEmail } from '@/lib/support';
import { ProgressBar } from '@/components/dashboard/ProgressBar';

type Member = {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  job_role: string;
  avatar_url?: string;
  is_online: boolean;
};

type Task = {
  _id: string;
  title: string;
  status: string;
  project_name?: string;
  assigned_users?: Array<{ _id: string; nom: string; prenom: string }>;
};

type ActivityRow = {
  _id: string;
  action_type: string;
  target_item_name: string;
  department: string;
  createdAt: string;
  user: { nom: string; prenom: string; avatar_url?: string };
};

type ProgressPayload = {
  project: string;
  totalTasks: number;
  completedTasks: number;
  totalProgress: number;
  perMember: Array<{
    member: Member;
    totalTasks: number;
    completedTasks: number;
    progress: number;
  }>;
};

export default function BackofficePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, loading: authLoading } = useAuth();
  const { locale, theme } = usePreferences();
  const s = dashboardSkin(theme);
  const isLight = theme === 'light';
  const borderLine = isLight ? 'border-slate-200' : 'border-white/[0.06]';

  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadError, setLoadError] = useState('');
  const [loadingAll, setLoadingAll] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [inviteNom, setInviteNom] = useState('');
  const [invitePrenom, setInvitePrenom] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'user' | 'manager' | 'admin'>('user');
  const [inviteJobRole, setInviteJobRole] = useState('');
  const [canInvite, setCanInvite] = useState(false);
  const [inviteResult, setInviteResult] = useState<{
    email: string;
    tempPassword: string;
    emailSent?: boolean;
    emailError?: string | null;
  } | null>(null);

  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [history, setHistory] = useState<ActivityRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [savingAssignment, setSavingAssignment] = useState(false);

  const [selectedProject, setSelectedProject] = useState<string>('');
  const [progress, setProgress] = useState<ProgressPayload | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);

  const t = (key: string, vars?: Record<string, string | number>) =>
    dashboardT(locale as AppLocale, key, vars);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/');
  }, [authLoading, user, router]);

  const refreshAll = async () => {
    if (!user?.token) return;
    setLoadingAll(true);
    setLoadError('');
    try {
      const h = authHeaders(user.token);
      const [mRes, tRes] = await Promise.all([
        fetch(`${API_BASE}/api/backoffice/members`, { headers: h }),
        fetch(`${API_BASE}/api/tasks`, { headers: h }),
      ]);
      if (!mRes.ok) {
        const err = await mRes.json().catch(() => ({}));
        throw new Error(err.message || 'Backoffice access denied');
      }
      setMembers((await mRes.json()) as Member[]);
      setTasks((await tRes.json()) as Task[]);
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoadingAll(false);
    }
  };

  useEffect(() => {
    if (user?.token) refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  const projects = useMemo(() => {
    const set = new Set<string>();
    for (const task of tasks) {
      const p = (task.project_name || '').trim();
      if (p) set.add(p);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  useEffect(() => {
    if (!selectedProject && projects.length) setSelectedProject(projects[0]);
  }, [projects, selectedProject]);

  const loadHistory = async (memberId: string) => {
    if (!user?.token || !memberId) return;
    setLoadingHistory(true);
    setHistory([]);
    try {
      const res = await fetch(`${API_BASE}/api/backoffice/members/${memberId}/history`, {
        headers: authHeaders(user.token),
      });
      if (!res.ok) throw new Error('Failed to load history');
      setHistory((await res.json()) as ActivityRow[]);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (selectedMemberId) loadHistory(selectedMemberId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMemberId]);

  const loadProgress = async (project: string) => {
    if (!user?.token || !project) return;
    setLoadingProgress(true);
    setProgress(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/backoffice/progress?project=${encodeURIComponent(project)}`,
        { headers: authHeaders(user.token) }
      );
      if (!res.ok) throw new Error('Failed to load progress');
      setProgress((await res.json()) as ProgressPayload);
    } catch {
      setProgress(null);
    } finally {
      setLoadingProgress(false);
    }
  };

  useEffect(() => {
    if (selectedProject) loadProgress(selectedProject);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject]);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) return;
    setInviteResult(null);
    setLoadError('');
    try {
      const res = await fetch(`${API_BASE}/api/backoffice/invite`, {
        method: 'POST',
        headers: authHeaders(user.token),
        body: JSON.stringify({
          nom: inviteNom,
          prenom: invitePrenom,
          email: inviteEmail,
          role: inviteRole,
          job_role: inviteJobRole,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) throw new Error(data.message || t('backofficeInviteForbidden'));
      if (!res.ok) throw new Error(data.message || 'Invite failed');
      setInviteResult({
        email: data.email,
        tempPassword: data.tempPassword,
        emailSent: data.emailSent,
        emailError: data.emailError,
      });
      setInviteNom('');
      setInvitePrenom('');
      setInviteEmail('');
      setInviteJobRole('');
      setInviteRole('user');
      await refreshAll();
    } catch (e2: unknown) {
      setLoadError(e2 instanceof Error ? e2.message : 'Invite failed');
    }
  };

  const removeMember = async (id: string) => {
    if (!user?.token) return;
    if (!window.confirm('Delete this member?')) return;
    setLoadError('');
    try {
      const res = await fetch(`${API_BASE}/api/backoffice/members/${id}`, {
        method: 'DELETE',
        headers: authHeaders(user.token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      if (selectedMemberId === id) {
        setSelectedMemberId('');
        setHistory([]);
      }
      await refreshAll();
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const toggleAssignee = (id: string) => {
    setAssigneeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const saveAssignment = async () => {
    if (!user?.token || !selectedTaskId) return;
    setSavingAssignment(true);
    setLoadError('');
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${selectedTaskId}`, {
        method: 'PATCH',
        headers: authHeaders(user.token),
        body: JSON.stringify({ assigned_users: assigneeIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Assign failed');
      await refreshAll();
      if (selectedProject) await loadProgress(selectedProject);
      if (selectedMemberId) await loadHistory(selectedMemberId);
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : 'Assign failed');
    } finally {
      setSavingAssignment(false);
    }
  };

  const selectedTask = useMemo(() => tasks.find((x) => x._id === selectedTaskId) || null, [
    tasks,
    selectedTaskId,
  ]);

  useEffect(() => {
    if (!selectedTask) return;
    const ids =
      selectedTask.assigned_users?.map((u) => u._id).filter(Boolean) || [];
    setAssigneeIds(ids);
  }, [selectedTask]);

  if (authLoading || !user) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center font-[Inter,system-ui,sans-serif] ${
          isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#0a0e17] text-slate-400'
        }`}
      >
        {t('loading')}
      </div>
    );
  }

  const jobLabel = user.job_role?.trim() || String(user.role || 'member').toUpperCase();

  return (
    <div className={`min-h-screen flex font-[Inter,system-ui,sans-serif] ${s.page}`}>
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
            <p className={`text-[10px] font-bold tracking-[0.2em] ${s.muted}`}>{t('workspace')}</p>
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
          onClick={() => openSupportEmail(user.email, `${user.prenom} ${user.nom}`)}
          className={`mt-3 flex items-center gap-3 px-3 py-2 text-sm w-full text-left ${s.helpHover}`}
        >
          <HelpCircle className="w-5 h-5 shrink-0" />
          {t('helpSupport')}
        </button>
        <button
          type="button"
          onClick={() => {
            logout();
            router.push('/');
          }}
          className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-red-400 text-sm w-full text-left"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {t('logOut')}
        </button>
      </aside>

      <main className="flex-1 px-4 py-6 md:px-8 md:py-8 min-w-0">
        <header className={`flex items-start justify-between gap-4 pb-6 border-b ${s.header}`}>
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className={`p-2 rounded-xl lg:hidden ${s.iconBtn} mt-1`}
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight">{t('backofficeTitle')}</h1>
              <p className={`text-sm mt-1 ${s.subtle}`}>
                {user.prenom} {user.nom} - {jobLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={refreshAll}
              className={`px-4 py-2 rounded-xl text-sm font-bold ${s.border}`}
              disabled={loadingAll}
            >
              Refresh
            </button>
          </div>
        </header>

        {loadError ? (
          <div className={`mt-6 px-4 py-3 rounded-2xl ${s.loadWarn}`}>{loadError}</div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          <section className="lg:col-span-5">
            <div className={`rounded-3xl overflow-hidden ${s.border}`}>
              <div className={`px-5 py-4 border-b ${borderLine}`}>
                <h2 className="font-bold">{t('backofficeInvite')}</h2>
              </div>
              {!canInvite ? (
                <p className={`p-5 text-sm ${s.muted}`}>{t('backofficeInviteForbidden')}</p>
              ) : (
              <form onSubmit={invite} className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className={`w-full px-3 py-2 rounded-xl border text-sm ${s.input}`}
                    placeholder="Prenom"
                    value={invitePrenom}
                    onChange={(e) => setInvitePrenom(e.target.value)}
                    required
                  />
                  <input
                    className={`w-full px-3 py-2 rounded-xl border text-sm ${s.input}`}
                    placeholder="Nom"
                    value={inviteNom}
                    onChange={(e) => setInviteNom(e.target.value)}
                    required
                  />
                </div>
                <input
                  className={`w-full px-3 py-2 rounded-xl border text-sm ${s.input}`}
                  placeholder="Email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    className={`w-full px-3 py-2 rounded-xl border text-sm ${s.input}`}
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                  >
                    <option value="user">user</option>
                    <option value="manager">manager</option>
                    <option value="admin">admin</option>
                  </select>
                  <input
                    className={`w-full px-3 py-2 rounded-xl border text-sm ${s.input}`}
                    placeholder="Job role"
                    value={inviteJobRole}
                    onChange={(e) => setInviteJobRole(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#3b82f6] to-[#7c5cfc] hover:opacity-95 shadow-lg shadow-[#3b82f6]/20"
                >
                  {t('backofficeSave')}
                </button>

                {inviteResult ? (
                  <div className={`mt-2 px-3 py-2 rounded-xl text-sm ${s.border}`}>
                    <div className={`text-xs font-bold tracking-[0.2em] ${s.muted}`}>
                      {t('backofficeTempPassword')}
                    </div>
                    <div className="font-mono text-sm mt-1">{inviteResult.tempPassword}</div>
                    <div className={`text-xs mt-1 ${s.muted}`}>{inviteResult.email}</div>
                    {inviteResult.emailSent ? (
                      <p className="text-xs text-emerald-500 mt-2">
                        {t('backofficeEmailSent', { email: inviteResult.email })}
                      </p>
                    ) : inviteResult.emailError ? (
                      <p className="text-xs text-amber-500 mt-2">
                        {t('backofficeEmailFailed', { error: inviteResult.emailError })}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </form>
              )}
            </div>
          </section>

          <section className="lg:col-span-7">
            <div className={`rounded-3xl overflow-hidden ${s.border}`}>
              <div className={`px-5 py-4 border-b ${borderLine}`}>
                <h2 className="font-bold">{t('teamMembers')}</h2>
              </div>

              {members.length === 0 ? (
                <div className={`px-5 py-6 ${s.muted}`}>{t('backofficeNoMembers')}</div>
              ) : (
                <div className={`divide-y ${s.divide}`}>
                  {members.map((m) => (
                    <div key={m._id} className="px-5 py-4 flex items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => setSelectedMemberId(m._id)}
                        className="text-left min-w-0 flex-1"
                        title={t('backofficeHistory')}
                      >
                        <div className="font-bold truncate">
                          {m.prenom} {m.nom}
                        </div>
                        <div className={`text-xs truncate ${s.muted}`}>
                          {m.email} - {m.role} {m.is_online ? '(online)' : '(offline)'}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => removeMember(m._id)}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${s.iconBtn}`}
                        title={t('backofficeDelete')}
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('backofficeDelete')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="lg:col-span-6">
            <div className={`rounded-3xl overflow-hidden ${s.border}`}>
              <div className={`px-5 py-4 border-b ${borderLine}`}>
                <h2 className="font-bold">{t('backofficeHistory')}</h2>
              </div>
              <div className="p-5">
                <select
                  className={`w-full px-3 py-2 rounded-xl border text-sm ${s.input}`}
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                >
                  <option value="">{t('backofficeSelectMember')}</option>
                  {members.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.prenom} {m.nom}
                    </option>
                  ))}
                </select>

                <div className="mt-4">
                  {loadingHistory ? (
                    <div className={s.muted}>{t('loading')}</div>
                  ) : !selectedMemberId ? (
                    <div className={s.muted}>{t('backofficeSelectMember')}</div>
                  ) : history.length === 0 ? (
                    <div className={s.muted}>{t('backofficeNoHistory')}</div>
                  ) : (
                    <ul className={`space-y-3`}>
                      {history.map((h) => (
                        <li key={h._id} className={`p-3 rounded-2xl ${s.border}`}>
                          <div className="text-sm font-bold">
                            {h.user?.prenom} {h.user?.nom} - {h.action_type}
                          </div>
                          <div className={`text-sm ${s.subtle}`}>{h.target_item_name}</div>
                          <div className={`text-xs mt-1 ${s.muted}`}>
                            {new Date(h.createdAt).toLocaleString()}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="lg:col-span-6">
            <div className={`rounded-3xl overflow-hidden ${s.border}`}>
              <div className={`px-5 py-4 border-b ${borderLine}`}>
                <h2 className="font-bold">{t('backofficeAssign')}</h2>
              </div>
              <div className="p-5 space-y-4">
                <select
                  className={`w-full px-3 py-2 rounded-xl border text-sm ${s.input}`}
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                >
                  <option value="">{t('backofficeSelectTask')}</option>
                  {tasks.map((task) => (
                    <option key={task._id} value={task._id}>
                      {task.title}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-2">
                  {members.map((m) => (
                    <button
                      key={m._id}
                      type="button"
                      onClick={() => toggleAssignee(m._id)}
                      className={`px-3 py-2 rounded-xl text-sm border text-left ${
                        assigneeIds.includes(m._id) ? s.navActive : s.input
                      }`}
                      disabled={!selectedTaskId}
                    >
                      {m.prenom} {m.nom}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={saveAssignment}
                  disabled={!selectedTaskId || savingAssignment}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#3b82f6] to-[#7c5cfc] hover:opacity-95 disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  {t('backofficeSave')}
                </button>
              </div>
            </div>
          </section>

          <section className="lg:col-span-12">
            <div className={`rounded-3xl overflow-hidden ${s.border}`}>
              <div className={`px-5 py-4 border-b ${borderLine}`}>
                <h2 className="font-bold">{t('backofficeProjectProgress')}</h2>
              </div>
              <div className="p-5 space-y-4">
                {projects.length === 0 ? (
                  <div className={s.muted}>{t('backofficeNoProjects')}</div>
                ) : (
                  <>
                    <select
                      className={`w-full px-3 py-2 rounded-xl border text-sm ${s.input}`}
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                    >
                      {projects.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>

                    {loadingProgress || !progress ? (
                      <div className={s.muted}>{t('loading')}</div>
                    ) : (
                      <div className="space-y-4">
                        <div className={`p-4 rounded-2xl ${s.border}`}>
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className={`text-xs font-bold tracking-[0.2em] ${s.muted}`}>
                                TOTAL
                              </div>
                              <div className="text-2xl font-black">{progress.totalProgress}%</div>
                              <div className={`text-xs mt-1 ${s.muted}`}>
                                {progress.completedTasks}/{progress.totalTasks} tasks completed
                              </div>
                            </div>
                            <div className="w-1/2">
                              <ProgressBar value={progress.totalProgress} light={isLight} />
                            </div>
                          </div>
                        </div>

                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-3`}>
                          {progress.perMember.map((row) => (
                            <div key={row.member._id} className={`p-4 rounded-2xl ${s.border}`}>
                              <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="font-bold truncate">
                                    {row.member.prenom} {row.member.nom}
                                  </div>
                                  <div className={`text-xs ${s.muted}`}>
                                    {row.completedTasks}/{row.totalTasks}
                                  </div>
                                </div>
                                <div className="text-xl font-black">{row.progress}%</div>
                              </div>
                              <div className="mt-3">
                                <ProgressBar value={row.progress} light={isLight} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
