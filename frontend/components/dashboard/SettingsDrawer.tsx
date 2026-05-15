"use client";

import React from 'react';
import { X, Menu, Globe2, Sun, Moon, Shield, Info, Download, Trash2, User } from 'lucide-react';
import type { AppLocale, AppTheme } from '@/context/PreferencesContext';
import { dashboardT } from '@/lib/dashboard-i18n';

export function SettingsDrawer({
  open,
  onClose,
  locale,
  setLocale,
  theme,
  setTheme,
  onClearActivityHistory,
  clearingActivityHistory,
  onOpenProfile,
}: {
  open: boolean;
  onClose: () => void;
  locale: AppLocale;
  setLocale: (l: AppLocale) => void;
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  onClearActivityHistory?: () => Promise<boolean> | boolean;
  clearingActivityHistory?: boolean;
  onOpenProfile?: () => void;
}) {
  const t = (key: string) => dashboardT(locale, key);
  const border = theme === 'light' ? 'border-slate-200' : 'border-white/[0.08]';
  const bg = theme === 'light' ? 'bg-white' : 'bg-[#0d1117]';
  const text = theme === 'light' ? 'text-slate-900' : 'text-white';
  const muted = theme === 'light' ? 'text-slate-500' : 'text-slate-400';
  const hoverBtn = theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-white/[0.06]';
  const listBorder = theme === 'light' ? 'border-slate-200 divide-slate-200' : 'border-white/[0.08] divide-white/[0.08]';

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        aria-label={t('settingsClose')}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 right-0 z-[70] h-full w-full max-w-[min(100%,380px)] border-l shadow-2xl flex flex-col animate-slide-in-right ${border} ${bg} ${text}`}
        role="dialog"
        aria-labelledby="settings-drawer-title"
      >
        <div className={`flex items-center justify-between gap-3 px-5 py-4 border-b ${border}`}>
          <div className="flex items-center gap-2 min-w-0">
            <Menu className={`w-5 h-5 shrink-0 ${muted}`} />
            <h2 id="settings-drawer-title" className="font-bold text-lg truncate">
              {t('settingsTitle')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl ${muted} ${hoverBtn}`}
            aria-label={t('settingsClose')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-8">
          <section>
            <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider mb-3 ${muted}`}>
              <Globe2 className="w-3.5 h-3.5" />
              {t('settingsLanguage')}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['fr', 'en'] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocale(code)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-semibold border transition-colors ${
                    locale === code
                      ? 'border-[#7c5cfc] bg-[#7c5cfc]/15 text-[#7c5cfc]'
                      : `${border} ${muted} hover:border-[#7c5cfc]/40`
                  }`}
                >
                  {t(code === 'fr' ? 'langFr' : 'langEn')}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider mb-3 ${muted}`}>
              {theme === 'dark' ? (
                <Moon className="w-3.5 h-3.5" />
              ) : (
                <Sun className="w-3.5 h-3.5" />
              )}
              {t('settingsTheme')}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold border transition-colors ${
                  theme === 'dark'
                    ? 'border-[#7c5cfc] bg-[#7c5cfc]/15 text-white'
                    : `${border} ${muted} hover:border-[#7c5cfc]/40`
                }`}
              >
                <Moon className="w-4 h-4" />
                {t('themeDark')}
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold border transition-colors ${
                  theme === 'light'
                    ? 'border-[#7c5cfc] bg-[#7c5cfc]/15 text-slate-900'
                    : `${border} ${muted} hover:border-[#7c5cfc]/40`
                }`}
              >
                <Sun className="w-4 h-4" />
                {t('themeLight')}
              </button>
            </div>
          </section>

          <section>
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${muted}`}>
              {t('settingsOther')}
            </p>
            <ul className={`rounded-xl border divide-y overflow-hidden ${listBorder}`}>
              <li>
                <button
                  type="button"
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm ${text} ${hoverBtn} transition-colors`}
                  onClick={() => {
                    if (onOpenProfile) onOpenProfile();
                  }}
                >
                  <User className={`w-4 h-4 shrink-0 ${muted}`} />
                  {t('editProfile')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm ${text} ${hoverBtn} transition-colors`}
                  onClick={() => {
                    window.alert(
                      locale === 'fr'
                        ? 'Politique de confidentialité (à lier à votre page légale).'
                        : 'Privacy policy (link to your legal page).'
                    );
                  }}
                >
                  <Shield className={`w-4 h-4 shrink-0 ${muted}`} />
                  {t('privacy')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm ${text} ${hoverBtn} transition-colors`}
                  onClick={() => {
                    window.alert('Nexus Task — workspace SaaS.');
                  }}
                >
                  <Info className={`w-4 h-4 shrink-0 ${muted}`} />
                  {t('about')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm ${text} ${hoverBtn} transition-colors`}
                  onClick={() => {
                    window.alert(
                      locale === 'fr'
                        ? 'Export à brancher sur votre API (CSV/JSON).'
                        : 'Hook this to your API (CSV/JSON).'
                    );
                  }}
                >
                  <Download className={`w-4 h-4 shrink-0 ${muted}`} />
                  {t('exportData')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  disabled={!onClearActivityHistory || clearingActivityHistory}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                    theme === 'light' ? 'text-red-600' : 'text-red-400'
                  } ${hoverBtn} disabled:opacity-60 disabled:cursor-not-allowed`}
                  onClick={async () => {
                    if (!onClearActivityHistory) return;
                    const ok = window.confirm(t('confirmClearActivity'));
                    if (!ok) return;
                    const cleared = await onClearActivityHistory();
                    if (cleared) window.alert(t('clearActivityDone'));
                  }}
                >
                  <Trash2 className={`w-4 h-4 shrink-0 ${theme === 'light' ? 'text-red-600' : 'text-red-400'}`} />
                  {t('clearActivity')}
                </button>
              </li>
            </ul>
          </section>
        </div>
      </aside>
    </>
  );
}
