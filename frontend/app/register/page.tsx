"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Zap, 
  ShieldCheck, 
  User, 
  Mail, 
  Lock, 
  LayoutGrid,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function RegisterForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectObjective, setProjectObjective] = useState('');
  const [projectDueDate, setProjectDueDate] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const searchParams = useSearchParams();
  const inviteProjectId = searchParams ? searchParams.get('invite') : null;
  const [invitedProjectName, setInvitedProjectName] = useState<string | null>(null);

  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!inviteProjectId) return;
    let active = true;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/onboarding/project/${inviteProjectId}`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Project not found');
      })
      .then((data) => {
        if (active) setInvitedProjectName(data.name);
      })
      .catch((err) => {
        console.error(err);
        if (active) setError("Le lien d'invitation n'est pas valide ou le projet a été supprimé.");
      });
    return () => {
      active = false;
    };
  }, [inviteProjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body: any = {
        fullName,
        email,
        password,
      };

      if (inviteProjectId) {
        body.projectId = inviteProjectId;
      } else {
        body.project = {
          name: projectName,
          objective: projectObjective,
          due_date: projectDueDate || null,
        };
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/onboarding/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      login(data.user);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center p-4 md:p-8 font-[Inter,system-ui,sans-serif] selection:bg-[#7c5cfc]/30">
      <div
        className={`w-full max-w-[1100px] h-auto lg:min-h-[720px] bg-[#0d1117] rounded-3xl border border-white/[0.08] overflow-hidden flex flex-col lg:flex-row shadow-2xl shadow-black/40 transition-all duration-700 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        {/* ─── Left Side – Hero / Marketing ─── */}
        <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-b from-[#0d1117] to-[#0a0e17] border-r border-white/[0.06] p-12 flex-col justify-center overflow-hidden">

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }}
          />

          {/* Radial glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(124,92,252,0.12),transparent_70%)] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(16,185,129,0.08),transparent_70%)] pointer-events-none" />

          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10 animate-fade-in-up">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#7c5cfc] to-[#a78bfa] flex items-center justify-center shadow-lg shadow-[#7c5cfc]/20">
                <LayoutGrid className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-white">
                Nexus Task
              </span>
            </div>

            <h1 className="text-[2.5rem] font-extrabold leading-[1.15] mb-6 text-white animate-fade-in-up delay-100">
              Start your journey with{' '}
              <span className="bg-gradient-to-r from-[#7c5cfc] to-[#a78bfa] bg-clip-text text-transparent">
                Nexus.
              </span>
            </h1>
            <p className="text-slate-400 text-base mb-14 leading-relaxed animate-fade-in-up delay-200 max-w-[340px]">
              Create an account and experience the future of collaborative task management.
            </p>

            {/* Feature list */}
            <div className="space-y-5 animate-fade-in-up delay-300">
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-[#7c5cfc]/10 flex items-center justify-center text-[#7c5cfc] shrink-0 group-hover:bg-[#7c5cfc]/20 transition-colors duration-300">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white text-[10px] uppercase tracking-[0.15em] mb-1">
                    Ultra Fast
                  </div>
                  <div className="text-slate-500 text-xs leading-relaxed">
                    Experience the speed of a native app in your browser.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 group-hover:bg-emerald-500/20 transition-colors duration-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white text-[10px] uppercase tracking-[0.15em] mb-1">
                    Security First
                  </div>
                  <div className="text-slate-500 text-xs leading-relaxed">
                    Your data is protected by enterprise standards.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0 group-hover:bg-amber-500/20 transition-colors duration-300">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white text-[10px] uppercase tracking-[0.15em] mb-1">
                    Team Collaboration
                  </div>
                  <div className="text-slate-500 text-xs leading-relaxed">
                    Work together seamlessly with real-time updates.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom decorative wave */}
          <div className="absolute bottom-0 left-0 w-full opacity-15 pointer-events-none">
            <svg viewBox="0 0 500 120" className="w-full h-auto" fill="none">
              <path
                d="M0,80 C80,50 160,90 240,60 C320,30 400,70 500,40"
                stroke="url(#regLineGrad)"
                strokeWidth="1.5"
                className="animate-draw-line"
              />
              <path
                d="M0,100 C100,75 200,110 300,80 C400,50 450,85 500,70"
                stroke="rgba(16,185,129,0.3)"
                strokeWidth="1"
                className="animate-draw-line delay-300"
              />
              <defs>
                <linearGradient id="regLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(124,92,252,0.1)" />
                  <stop offset="50%" stopColor="rgba(124,92,252,0.5)" />
                  <stop offset="100%" stopColor="rgba(124,92,252,0.1)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* ─── Right Side – Register Form ─── */}
        <div className="w-full lg:w-[55%] p-8 md:p-12 lg:py-14 flex flex-col justify-center bg-[#0d1117]">
          <div className="max-w-[460px] w-full mx-auto">
            {/* Header */}
            <div className="mb-8 animate-fade-in-up">
              <h2 className="text-[2rem] font-extrabold text-white mb-2 tracking-tight">
                {inviteProjectId && invitedProjectName 
                  ? `Rejoindre ${invitedProjectName}`
                  : "Create Account"}
              </h2>
              <p className="text-slate-400 text-sm">
                {inviteProjectId && invitedProjectName
                  ? "Créez votre compte pour collaborer avec l'équipe sur Nexus Task."
                  : "Join our community of high-performers."}
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5 animate-fade-in-up">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up delay-100">
              {/* Name */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  Name
                </label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-slate-600 group-focus-within:text-[#7c5cfc] transition-colors duration-200" />
                  <input
                    id="register-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full h-[46px] pl-11 pr-4 rounded-xl bg-white/[0.02] border border-white/[0.08] text-white placeholder:text-slate-600 focus:border-[#7c5cfc] focus:shadow-[0_0_0_3px_rgba(124,92,252,0.12)] transition-all duration-200 text-sm"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-slate-600 group-focus-within:text-[#7c5cfc] transition-colors duration-200" />
                  <input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="w-full h-[46px] pl-11 pr-4 rounded-xl bg-white/[0.02] border border-white/[0.08] text-white placeholder:text-slate-600 focus:border-[#7c5cfc] focus:shadow-[0_0_0_3px_rgba(124,92,252,0.12)] transition-all duration-200 text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-slate-600 group-focus-within:text-[#7c5cfc] transition-colors duration-200" />
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full h-[46px] pl-11 pr-11 rounded-xl bg-white/[0.02] border border-white/[0.08] text-white placeholder:text-slate-600 focus:border-[#7c5cfc] focus:shadow-[0_0_0_3px_rgba(124,92,252,0.12)] transition-all duration-200 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Password strength hint */}
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex gap-1 flex-1">
                    <div className={`h-1 rounded-full flex-1 transition-colors duration-300 ${password.length >= 2 ? 'bg-red-400' : 'bg-white/[0.06]'}`} />
                    <div className={`h-1 rounded-full flex-1 transition-colors duration-300 ${password.length >= 5 ? 'bg-amber-400' : 'bg-white/[0.06]'}`} />
                    <div className={`h-1 rounded-full flex-1 transition-colors duration-300 ${password.length >= 8 ? 'bg-emerald-400' : 'bg-white/[0.06]'}`} />
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium ml-2">
                    {password.length === 0 ? '' : password.length < 5 ? 'Weak' : password.length < 8 ? 'Medium' : 'Strong'}
                  </span>
                </div>
              </div>

              {/* Project setup */}
              {!inviteProjectId && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                      <LayoutGrid className="w-4 h-4 text-slate-300" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        Project setup
                      </div>
                      <div className="text-xs text-slate-400">Create your first project.</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        Project name
                      </label>
                      <input
                        id="register-project-name"
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Nexus Launch"
                        required={!inviteProjectId}
                        className="w-full h-[46px] px-4 rounded-xl bg-white/[0.02] border border-white/[0.08] text-white placeholder:text-slate-600 focus:border-[#7c5cfc] focus:shadow-[0_0_0_3px_rgba(124,92,252,0.12)] transition-all duration-200 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        Objective
                      </label>
                      <textarea
                        id="register-project-objective"
                        value={projectObjective}
                        onChange={(e) => setProjectObjective(e.target.value)}
                        placeholder="What are you trying to achieve?"
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.08] text-white placeholder:text-slate-600 focus:border-[#7c5cfc] focus:shadow-[0_0_0_3px_rgba(124,92,252,0.12)] transition-all duration-200 text-sm resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        Due date
                      </label>
                      <input
                        id="register-project-due"
                        type="date"
                        value={projectDueDate}
                        onChange={(e) => setProjectDueDate(e.target.value)}
                        className="w-full h-[46px] px-4 rounded-xl bg-white/[0.02] border border-white/[0.08] text-white placeholder:text-slate-600 focus:border-[#7c5cfc] focus:shadow-[0_0_0_3px_rgba(124,92,252,0.12)] transition-all duration-200 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="pt-1" />
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[50px] rounded-xl btn-shimmer text-[#0a0e17] font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-[#0a0e17]/30 border-t-[#0a0e17] rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {inviteProjectId ? "Rejoindre le projet" : "Create Free Account"}
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center animate-fade-in-up delay-400">
              <p className="text-slate-500 text-sm">
                Already have an account?{' '}
                <Link
                  href="/"
                  className="text-white font-bold hover:text-[#7c5cfc] transition-colors duration-200"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center text-slate-400 font-[Inter,system-ui,sans-serif]">
        <div className="w-8 h-8 border-2 border-slate-500 border-t-[#7c5cfc] rounded-full animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
