"use client";

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { API_BASE, authHeaders } from '@/lib/api';

const STATUSES = ['To Do', 'In Progress', 'Completed'] as const;
const PRIORITIES = ['Normal', 'High', 'Urgent'] as const;

export type EditTaskPayload = {
  _id: string;
  title: string;
  description?: string;
  project_name?: string;
  department?: string;
  status: string;
  priority: string;
  due_date: string | null;
};

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditTaskModal({
  open,
  token,
  task,
  onClose,
  onSaved,
  light,
}: {
  open: boolean;
  token: string;
  task: EditTaskPayload | null;
  onClose: () => void;
  onSaved: () => void;
  light?: boolean;
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

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description || '');
    setProject_name(task.project_name || '');
    setDepartment(task.department || '');
    setStatus((STATUSES.includes(task.status as (typeof STATUSES)[number]) ? task.status : 'To Do') as (typeof STATUSES)[number]);
    setPriority((PRIORITIES.includes(task.priority as (typeof PRIORITIES)[number]) ? task.priority : 'Normal') as (typeof PRIORITIES)[number]);
    setDue_date(toDatetimeLocalValue(task.due_date));
    setError('');
  }, [task]);

  if (!open || !task) return null;

  const panel = light
    ? 'border-slate-200 bg-white text-slate-900'
    : 'border-white/[0.1] bg-[#0d1117] text-white';
  const input = light
    ? 'bg-slate-50 border-slate-200 text-slate-900'
    : 'bg-white/[0.04] border-white/[0.08] text-white';
  const label = light ? 'text-slate-500' : 'text-slate-500';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token?.trim()) {
      setError('Session expirée.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${task._id}`, {
        method: 'PATCH',
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
      if (!res.ok) throw new Error(data.message || 'Échec de la mise à jour');
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className={`w-full max-w-lg rounded-2xl border shadow-2xl ${panel}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${light ? 'border-slate-200' : 'border-white/[0.06]'}`}>
          <h2 className="text-lg font-bold">Modifier la tâche</h2>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-lg ${light ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <p className={`text-sm rounded-lg px-3 py-2 ${light ? 'text-red-700 bg-red-50 border border-red-200' : 'text-red-400 bg-red-500/10 border border-red-500/20'}`}>
              {error}
            </p>
          )}
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${label}`}>
              Titre
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full h-10 px-3 rounded-xl border text-sm ${input}`}
            />
          </div>
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${label}`}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 rounded-xl border text-sm resize-none ${input}`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${label}`}>
                Projet
              </label>
              <input
                value={project_name}
                onChange={(e) => setProject_name(e.target.value)}
                className={`w-full h-10 px-3 rounded-xl border text-sm ${input}`}
              />
            </div>
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${label}`}>
                Département
              </label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={`w-full h-10 px-3 rounded-xl border text-sm ${input}`}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${label}`}>
                Statut
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}
                className={`w-full h-10 px-3 rounded-xl border text-sm ${input}`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} className={light ? 'bg-white' : 'bg-[#0d1117]'}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${label}`}>
                Priorité
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as (typeof PRIORITIES)[number])}
                className={`w-full h-10 px-3 rounded-xl border text-sm ${input}`}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p} className={light ? 'bg-white' : 'bg-[#0d1117]'}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${label}`}>
              Échéance
            </label>
            <input
              type="datetime-local"
              value={due_date}
              onChange={(e) => setDue_date(e.target.value)}
              className={`w-full h-10 px-3 rounded-xl border text-sm ${input}`}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl btn-shimmer text-[#0a0e17] font-bold text-sm disabled:opacity-50"
          >
            {loading ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  );
}
