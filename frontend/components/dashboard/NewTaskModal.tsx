"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { API_BASE, authHeaders } from '@/lib/api';

const STATUSES = ['To Do', 'In Progress', 'Completed'] as const;
const PRIORITIES = ['Normal', 'High', 'Urgent'] as const;

export function NewTaskModal({
  open,
  token,
  onClose,
  onCreated,
}: {
  open: boolean;
  token: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [project_name, setProject_name] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('To Do');
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>('Normal');
  const [due_date, setDue_date] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const reset = () => {
    setTitle('');
    setDescription('');
    setProject_name('');
    setDepartment('');
    setStatus('To Do');
    setPriority('Normal');
    setDue_date('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token?.trim()) {
      setError('Session expirée : reconnectez-vous pour enregistrer la tâche en base.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          title,
          description,
          project_name,
          department,
          status,
          priority,
          due_date: due_date || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          data.message ||
          (res.status === 503
            ? 'Serveur ou MongoDB indisponible — la tâche n’a pas pu être enregistrée.'
            : 'Échec de la création de la tâche.');
        throw new Error(msg);
      }
      reset();
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#0d1117] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-bold text-white">New Task</h2>
          <button
            type="button"
            onClick={() => { reset(); onClose(); }}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Title
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Project
              </label>
              <input
                value={project_name}
                onChange={(e) => setProject_name(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Department (activity)
              </label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Engineering"
                className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-slate-600"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}
                className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-[#0d1117]">
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as (typeof PRIORITIES)[number])}
                className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p} className="bg-[#0d1117]">
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Due date
            </label>
            <input
              type="datetime-local"
              value={due_date}
              onChange={(e) => setDue_date(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !token?.trim()}
            className="w-full h-11 rounded-xl btn-shimmer text-[#0a0e17] font-bold text-sm disabled:opacity-50"
          >
            {loading ? 'Enregistrement…' : 'Create Task'}
          </button>
        </form>
      </div>
    </div>
  );
}
