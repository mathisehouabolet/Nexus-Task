/** Ouvre la composition Gmail dans un nouvel onglet */
export function openGmailCompose(to: string, subject?: string, body?: string): void {
  const params = new URLSearchParams({ view: 'cm', fs: '1', to: to.trim() });
  if (subject) params.set('su', subject);
  if (body) params.set('body', body);
  window.open(`https://mail.google.com/mail/?${params.toString()}`, '_blank', 'noopener,noreferrer');
}
