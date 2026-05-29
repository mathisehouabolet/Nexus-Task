"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Briefcase, HelpCircle, LayoutGrid, LogOut, Mail, Plus, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import type { AppLocale } from '@/context/PreferencesContext';
import { API_BASE, authHeaders } from '@/lib/api';
import { dashboardT } from '@/lib/dashboard-i18n';
import { dashboardSkin } from '@/lib/dashboard-theme';
import { openSupportEmail } from '@/lib/support';
import { openGmailCompose } from '@/lib/gmail';

type TeamMemberRow = {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  job_role: string;
  avatar_url?: string;
  is_online: boolean;
};

function initials(prenom: string, nom: string) {
  const a = (prenom?.[0] || '') + (nom?.[0] || '');
  return a.toUpperCase() || '?';
}

export default function TeamPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, loading: authLoading } = useAuth();
  const { locale, theme } = usePreferences();
  const s = dashboardSkin(theme);
  const isLight = theme === 'light';
  const borderLine = isLight ? 'border-slate-200' : 'border-white/[0.06]';

  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteLink = React.useMemo(() => {
    if (typeof window === 'undefined' || !user?.projectId) return '';
    return `${window.location.origin}/register?invite=${user.projectId}`;
  }, [user?.projectId]);

  const t = (key: string, vars?: Record<string, string | number>) =>
    dashboardT(locale as AppLocale, key, vars);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
    }
  }, [authLoading, user, router]);

  const loadMembers = React.useCallback(async (showLoading = true) => {
    if (!user?.token) return;
    if (showLoading) setLoadingMembers(true);
    setLoadError('');
    try {
      const res = await fetch(`${API_BASE}/api/team/members`, {
        headers: authHeaders(user.token),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to load team');
      }
      const data = (await res.json()) as TeamMemberRow[];
      setMembers(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load team');
    } finally {
      if (showLoading) setLoadingMembers(false);
    }
  }, [user?.token]);

  useEffect(() => {
    loadMembers(true);
    const intervalId = window.setInterval(() => loadMembers(false), 20_000);
    return () => window.clearInterval(intervalId);
  }, [loadMembers]);

  const activeCount = useMemo(
    () => members.filter((m) => m.is_online).length,
    [members]
  );

  if (authLoading || !user) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center font-[Inter,system-ui,sans-serif] ${
          theme === 'light' ? 'bg-slate-100 text-slate-500' : 'bg-[#0a0e17] text-slate-400'
        }`}
      >
        {dashboardT(locale as AppLocale, 'loading')}
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
              <h1 className="text-2xl font-black tracking-tight">{t('teamTitle')}</h1>
              <p className={`text-sm mt-1 ${s.subtle}`}>
                {user.prenom} {user.nom} - {jobLabel}
              </p>
            </div>
          </div>
          <div className={`px-4 py-3 rounded-2xl ${s.border}`}>
            <div className={`text-xs font-bold tracking-[0.2em] ${s.muted}`}>
              {t('teamActiveCount')}
            </div>
            <div className="text-2xl font-black mt-1">{activeCount}</div>
          </div>
        </header>

        {loadError ? (
          <div className={`mt-6 px-4 py-3 rounded-2xl ${s.loadWarn}`}>{loadError}</div>
        ) : null}

        {user?.projectId && user.role === 'admin' ? (
          <div className={`mt-6 p-6 rounded-3xl ${s.border} bg-gradient-to-r from-[#7c5cfc]/10 to-[#3b82f6]/10 relative overflow-hidden`}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(124,92,252,0.15),transparent_70%)] pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className={`font-bold text-base ${s.heading} mb-1`}>
                  {t('backofficeInviteLinkTitle')}
                </h3>
                <p className={`text-xs ${s.muted}`}>
                  {t('backofficeInviteLinkDesc')}
                </p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                <input
                  readOnly
                  value={inviteLink}
                  className={`px-3 py-2.5 rounded-xl text-xs flex-1 md:w-[320px] ${s.input}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white text-[#0a0e17] hover:bg-white/90 transition-all cursor-pointer shrink-0 shadow-lg shadow-white/5 active:scale-95"
                >
                  {copied ? t('backofficeCopied') : t('backofficeCopy')}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <section className="mt-6">
          <div className={`rounded-3xl overflow-hidden ${s.border}`}>
            <div className={`px-5 py-4 border-b ${borderLine}`}>
              <h2 className="font-bold">{t('teamMembers')}</h2>
            </div>

            {loadingMembers ? (
              <div className={`px-5 py-6 ${s.muted}`}>{t('loading')}</div>
            ) : members.length === 0 ? (
              <div className={`px-5 py-6 ${s.muted}`}>{t('teamEmpty')}</div>
            ) : (
              <div className={`divide-y ${s.divide}`}>
                {/* Header row - Hidden on mobile, shown on desktop */}
                <div className={`hidden md:grid grid-cols-12 gap-3 px-5 py-3 text-xs font-bold ${s.muted}`}>
                  <div className="col-span-4">{t('teamMembers')}</div>
                  <div className="col-span-2">{t('teamStatus')}</div>
                  <div className="col-span-2">{t('teamRole')}</div>
                  <div className="col-span-3">{t('teamEmail')}</div>
                  <div className="col-span-1 text-right">{t('teamSendEmail')}</div>
                </div>
                {members.map((m) => (
                  <div key={m._id} className="flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-3 px-5 py-4 items-start md:items-center">
                    <div className="w-full md:col-span-4 flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-2xl border ${s.avatarBorder} bg-white/[0.04] flex items-center justify-center overflow-hidden shrink-0`}>
                        {m.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-black">{initials(m.prenom, m.nom)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold truncate">
                          {m.prenom} {m.nom}
                        </div>
                        <div className={`text-xs truncate ${s.muted}`}>{m.job_role || '-'}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 md:col-span-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          m.is_online ? 'bg-emerald-500' : 'bg-slate-500'
                        }`}
                      />
                      <span className={`text-sm ${s.subtle}`}>
                        {m.is_online ? t('teamOnline') : t('teamOffline')}
                      </span>
                    </div>

                    <div className="md:col-span-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 md:hidden mr-2">Role:</span>
                      <span className={`text-sm ${s.subtle}`}>{m.role}</span>
                    </div>

                    <div className="w-full md:col-span-3 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 md:hidden mr-2">Email:</span>
                      <span className={`text-sm truncate inline-block md:block ${s.subtle}`}>{m.email}</span>
                    </div>

                    <div className="w-full md:col-span-1 flex justify-end md:justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          openGmailCompose(
                            m.email,
                            `[Nexus Task] ${m.prenom} ${m.nom}`,
                            ''
                          )
                        }
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${s.iconBtn}`}
                        title={t('teamSendEmail')}
                      >
                        <Mail className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
