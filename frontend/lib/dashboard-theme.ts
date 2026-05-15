import type { AppTheme } from '@/context/PreferencesContext';

/** Classes Tailwind du dashboard Nexus : sombre = design initial, clair = palette cohérente. */
export function dashboardSkin(theme: AppTheme) {
  if (theme === 'light') {
    return {
      page: 'bg-slate-100 text-slate-900',
      aside: 'border-r border-slate-200 bg-white shadow-sm',
      border: 'border border-slate-200',
      header: 'border-slate-200 bg-white/95 backdrop-blur-md',
      muted: 'text-slate-500',
      subtle: 'text-slate-600',
      heading: 'text-slate-900',
      input:
        'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400',
      navActive: 'bg-[#3b82f6]/10 text-slate-900 border border-[#3b82f6]/25',
      navInactive: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
      divide: 'divide-slate-200',
      dashedBox: 'border-slate-200 bg-slate-50',
      avatarBorder: 'border-slate-200',
      focusAvatarRing: 'border-slate-50',
      teamOnlineRing: 'ring-white',
      helpHover: 'text-slate-600 hover:text-slate-900',
      iconBtn: 'text-slate-500 hover:bg-slate-100',
      taskDoneText: 'text-slate-400',
      taskTitle: 'text-slate-900',
      loadWarn:
        'text-amber-800 border border-amber-200 bg-amber-50',
    };
  }
  return {
    page: 'bg-[#0a0e17] text-white',
    aside: 'border-r border-white/[0.06] bg-[#080b12]',
    border: 'border border-white/[0.08]',
    header: 'border-white/[0.06] bg-[#0a0e17]/90 backdrop-blur-md',
    muted: 'text-slate-500',
    subtle: 'text-slate-400',
    heading: 'text-white',
    input:
      'bg-white/[0.04] border-white/[0.08] text-slate-300 placeholder:text-slate-600',
    navActive: 'bg-[#3b82f6]/15 text-white border border-[#3b82f6]/25',
    navInactive: 'text-slate-400 hover:text-white hover:bg-white/[0.04]',
    divide: 'divide-white/[0.06]',
    dashedBox: 'border-white/[0.08] bg-white/[0.02]',
    avatarBorder: 'border-white/10',
    focusAvatarRing: 'border-[#080b12]',
    teamOnlineRing: 'ring-[#0d1117]',
    helpHover: 'text-slate-500 hover:text-white',
    iconBtn: 'text-slate-400 hover:bg-white/[0.06]',
    taskDoneText: 'text-slate-500',
    taskTitle: 'text-white',
    loadWarn:
      'text-amber-400 border border-amber-500/20 bg-amber-500/10',
  };
}
