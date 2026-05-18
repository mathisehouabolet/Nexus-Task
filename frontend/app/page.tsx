"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Zap, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  LayoutGrid,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ─── Animated chart SVG for left panel background ─── */
function ChartBackground() {
  return (
    <svg
      className="absolute bottom-0 left-0 w-full h-[60%] pointer-events-none"
      viewBox="0 0 500 300"
      preserveAspectRatio="none"
      fill="none"
    >
      <defs>
        <linearGradient id="chartGradient1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(124,92,252,0.25)" />
          <stop offset="100%" stopColor="rgba(124,92,252,0)" />
        </linearGradient>
        <linearGradient id="chartGradient2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(59,130,246,0.15)" />
          <stop offset="100%" stopColor="rgba(59,130,246,0)" />
        </linearGradient>
        <linearGradient id="lineGrad1" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(124,92,252,0.1)" />
          <stop offset="50%" stopColor="rgba(124,92,252,0.6)" />
          <stop offset="100%" stopColor="rgba(124,92,252,0.1)" />
        </linearGradient>
        <linearGradient id="lineGrad2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(59,130,246,0.1)" />
          <stop offset="50%" stopColor="rgba(59,130,246,0.5)" />
          <stop offset="100%" stopColor="rgba(59,130,246,0.1)" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[...Array(8)].map((_, i) => (
        <line
          key={`h-${i}`}
          x1="0" y1={i * 42} x2="500" y2={i * 42}
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="1"
        />
      ))}
      {[...Array(10)].map((_, i) => (
        <line
          key={`v-${i}`}
          x1={i * 55} y1="0" x2={i * 55} y2="300"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="1"
        />
      ))}

      {/* Area fill */}
      <path
        d="M0,250 C60,230 100,200 150,180 C200,160 230,190 280,140 C330,90 370,110 420,60 C450,35 480,50 500,30 L500,300 L0,300 Z"
        fill="url(#chartGradient1)"
        className="animate-fade-in"
      />
      <path
        d="M0,270 C80,255 140,240 200,230 C260,220 300,250 350,210 C400,170 440,190 500,150 L500,300 L0,300 Z"
        fill="url(#chartGradient2)"
        className="animate-fade-in delay-300"
      />

      {/* Lines */}
      <path
        d="M0,250 C60,230 100,200 150,180 C200,160 230,190 280,140 C330,90 370,110 420,60 C450,35 480,50 500,30"
        stroke="url(#lineGrad1)"
        strokeWidth="2"
        className="animate-draw-line"
      />
      <path
        d="M0,270 C80,255 140,240 200,230 C260,220 300,250 350,210 C400,170 440,190 500,150"
        stroke="url(#lineGrad2)"
        strokeWidth="1.5"
        className="animate-draw-line delay-500"
      />

      {/* Data points */}
      {[
        { cx: 150, cy: 180 },
        { cx: 280, cy: 140 },
        { cx: 420, cy: 60 },
      ].map((pt, i) => (
        <g key={i} className="animate-fade-in" style={{ animationDelay: `${0.8 + i * 0.2}s` }}>
          <circle cx={pt.cx} cy={pt.cy} r="6" fill="rgba(124,92,252,0.15)" />
          <circle cx={pt.cx} cy={pt.cy} r="3" fill="#7c5cfc" />
        </g>
      ))}

      {/* Vertical bar charts in foreground */}
      {[
        { x: 60, h: 60 },
        { x: 115, h: 90 },
        { x: 170, h: 45 },
        { x: 225, h: 110 },
        { x: 280, h: 75 },
        { x: 335, h: 130 },
        { x: 390, h: 95 },
        { x: 445, h: 65 },
      ].map((bar, i) => (
        <rect
          key={i}
          x={bar.x}
          y={300 - bar.h}
          width="20"
          rx="3"
          height={bar.h}
          fill="rgba(124,92,252,0.08)"
          className="animate-fade-in"
          style={{ animationDelay: `${0.3 + i * 0.08}s` }}
        />
      ))}
    </svg>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { user, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      login(data);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  /* ─── Login form (redirect if already logged in) ─── */
  if (user) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center text-slate-500 text-sm">
        Redirecting…
      </div>
    );
  }

  /* ─── Login form ─── */
  return (
    <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center p-4 md:p-8 font-[Inter,system-ui,sans-serif] selection:bg-[#7c5cfc]/30">
      <div
        className={`w-full max-w-[1100px] min-h-[720px] bg-[#0d1117] rounded-3xl border border-white/[0.08] overflow-hidden flex flex-col lg:flex-row shadow-2xl shadow-black/40 transition-all duration-700 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
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

          {/* Chart background */}
          <ChartBackground />

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
              Accelerate your workflow with{' '}
              <span className="bg-gradient-to-r from-[#7c5cfc] to-[#a78bfa] bg-clip-text text-transparent">
                intelligence.
              </span>
            </h1>
            <p className="text-slate-400 text-base mb-14 leading-relaxed animate-fade-in-up delay-200 max-w-[340px]">
              Join thousands of teams managing complex projects with modern minimalism and speed.
            </p>

            {/* Feature cards */}
            <div className="grid grid-cols-2 gap-3 animate-fade-in-up delay-300">
              <div className="p-5 rounded-2xl glass border border-white/[0.06] hover:border-[#7c5cfc]/30 transition-all duration-300 group">
                <div className="w-9 h-9 rounded-lg bg-[#7c5cfc]/10 flex items-center justify-center mb-3 group-hover:bg-[#7c5cfc]/20 transition-colors">
                  <Zap className="w-4 h-4 text-[#7c5cfc]" />
                </div>
                <div className="font-bold text-white text-[10px] uppercase tracking-[0.15em] mb-1">
                  Performance
                </div>
                <div className="text-slate-500 text-xs leading-relaxed">
                  Zero lag interactions.
                </div>
              </div>
              <div className="p-5 rounded-2xl glass border border-white/[0.06] hover:border-emerald-500/30 transition-all duration-300 group">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3 group-hover:bg-emerald-500/20 transition-colors">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="font-bold text-white text-[10px] uppercase tracking-[0.15em] mb-1">
                  Privacy
                </div>
                <div className="text-slate-500 text-xs leading-relaxed">
                  Enterprise security.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Right Side – Login Form ─── */}
        <div className="w-full lg:w-[55%] p-8 md:p-16 flex flex-col justify-center bg-[#0d1117]">
          <div className="max-w-[400px] w-full mx-auto">
            {/* Header */}
            <div className="mb-10 animate-fade-in-up">
              <h2 className="text-[2rem] font-extrabold text-white mb-2 tracking-tight">
                Welcome back
              </h2>
              <p className="text-slate-400 text-sm">
                Please enter your details to sign in.
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
            <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up delay-300">
              {/* Email */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-slate-600 group-focus-within:text-[#7c5cfc] transition-colors duration-200" />
                  <input
                    id="login-email"
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
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-[10px] font-bold text-[#7c5cfc] hover:text-[#a78bfa] transition-colors duration-200"
                  >
                    Forgot?
                  </a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-slate-600 group-focus-within:text-[#7c5cfc] transition-colors duration-200" />
                  <input
                    id="login-password"
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
                <div className="flex items-center gap-2 mt-1.5">
                  <AlertCircle className="w-3 h-3 text-amber-400/60" />
                  <p className="text-[10px] text-amber-400/60 font-medium">
                    Password must be at least 8 characters.
                  </p>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[50px] rounded-xl btn-shimmer text-[#0a0e17] font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-[#0a0e17]/30 border-t-[#0a0e17] rounded-full animate-spin" />
                ) : (
                  'Sign In to Workspace'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-10 text-center animate-fade-in-up delay-500">
              <p className="text-slate-500 text-sm">
                Don&apos;t have an account?{' '}
                <Link
                  href="/register"
                  className="text-white font-bold hover:text-[#7c5cfc] transition-colors duration-200"
                >
                  Create Account
                </Link>
              </p>
              <p className="mt-5 text-[10px] text-slate-600 leading-relaxed">
                By signing in, you agree to our{' '}
                <a href="#" className="underline underline-offset-2 hover:text-slate-400 transition-colors">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="underline underline-offset-2 hover:text-slate-400 transition-colors">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RootPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  return <LoginForm />;
}
