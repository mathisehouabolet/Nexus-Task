"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { API_BASE, authHeaders } from '@/lib/api';
import { dashboardSkin } from '@/lib/dashboard-theme';

export default function ProfilePage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const { theme, locale } = usePreferences();
  const s = dashboardSkin(theme);
  const isLight = theme === 'light';

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    setTimeout(() => {
      setNom(user.nom || '');
      setPrenom(user.prenom || '');
      setEmail(user.email || '');
      setJobRole(user.job_role || '');
      setAvatarUrl(user.avatar_url || '');
    }, 0);
  }, [user, router]);

  const title = useMemo(() => (locale === 'fr' ? 'Mon profil' : 'My profile'), [locale]);
  const saveLabel = useMemo(() => (locale === 'fr' ? 'Enregistrer' : 'Save changes'), [locale]);
  const savingLabel = useMemo(() => (locale === 'fr' ? 'Enregistrement…' : 'Saving…'), [locale]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) return;
    if (!nom.trim() || !prenom.trim() || !email.trim()) {
      window.alert(locale === 'fr' ? 'Nom, prénom et e-mail sont requis.' : 'Name and email are required.');
      return;
    }
    if (password && password.length < 6) {
      window.alert(locale === 'fr' ? 'Mot de passe trop court (min 6).' : 'Password too short (min 6).');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.trim(),
        job_role: jobRole.trim(),
        avatar_url: avatarUrl.trim(),
      };
      if (password) payload.password = password;

      const res = await fetch(`${API_BASE}/api/users/${user._id}`, {
        method: 'PUT',
        headers: authHeaders(user.token),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Update failed');
      }
      const updated = await res.json();
      login({
        ...user,
        nom: updated.nom ?? payload.nom,
        prenom: updated.prenom ?? payload.prenom,
        email: updated.email ?? payload.email,
        avatar_url: updated.avatar_url ?? payload.avatar_url,
        job_role: updated.job_role ?? payload.job_role,
        token: user.token,
      });
      setPassword('');
      window.alert(locale === 'fr' ? 'Profil mis à jour.' : 'Profile updated.');
    } catch (err: unknown) {
      window.alert(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-[Inter,system-ui,sans-serif] ${s.page}`}>
        <div className={`text-sm ${s.muted}`}>{locale === 'fr' ? 'Redirection…' : 'Redirecting…'}</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-[Inter,system-ui,sans-serif] ${s.page}`}>
      <header className={`h-[72px] shrink-0 border-b flex items-center gap-4 px-8 ${s.border} ${s.header}`}>
        <Link
          href="/dashboard"
          className={`inline-flex items-center gap-2 text-sm font-semibold ${s.iconBtn} px-3 py-2 rounded-xl`}
        >
          <ArrowLeft className="w-4 h-4" />
          {locale === 'fr' ? 'Dashboard' : 'Dashboard'}
        </Link>
        <div className="flex-1" />
      </header>

      <main className="max-w-3xl mx-auto p-8">
        <h1 className={`text-2xl font-bold mb-6 ${s.heading}`}>{title}</h1>

        <form onSubmit={submit} className={`rounded-2xl p-6 border ${s.border} ${isLight ? 'bg-white shadow-sm' : 'bg-[#0d1117]/60'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-sm">
              <span className={`block mb-1 ${s.muted}`}>{locale === 'fr' ? 'Prénom' : 'First name'}</span>
              <input
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className={`w-full h-11 px-3 rounded-xl border text-sm ${s.input}`}
              />
            </label>
            <label className="text-sm">
              <span className={`block mb-1 ${s.muted}`}>{locale === 'fr' ? 'Nom' : 'Last name'}</span>
              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className={`w-full h-11 px-3 rounded-xl border text-sm ${s.input}`}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className={`block mb-1 ${s.muted}`}>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full h-11 px-3 rounded-xl border text-sm ${s.input}`}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className={`block mb-1 ${s.muted}`}>{locale === 'fr' ? 'Poste / Rôle' : 'Job role'}</span>
              <input
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                className={`w-full h-11 px-3 rounded-xl border text-sm ${s.input}`}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className={`block mb-1 ${s.muted}`}>{locale === 'fr' ? 'URL avatar' : 'Avatar URL'}</span>
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className={`w-full h-11 px-3 rounded-xl border text-sm ${s.input}`}
                placeholder="https://…"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className={`block mb-1 ${s.muted}`}>{locale === 'fr' ? 'Nouveau mot de passe (optionnel)' : 'New password (optional)'}</span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full h-11 px-3 pr-11 rounded-xl border text-sm ${s.input}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg ${s.iconBtn}`}
                  aria-label={showPassword ? (locale === 'fr' ? 'Masquer le mot de passe' : 'Hide password') : (locale === 'fr' ? 'Voir le mot de passe' : 'Show password')}
                  title={showPassword ? (locale === 'fr' ? 'Masquer' : 'Hide') : (locale === 'fr' ? 'Voir' : 'Show')}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#3b82f6] text-white px-4 py-2.5 text-sm font-semibold hover:opacity-95 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? savingLabel : saveLabel}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
