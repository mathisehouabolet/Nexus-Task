/**
 * Adresse du développeur / support SaaS.
 * Définir dans .env.local : NEXT_PUBLIC_SUPPORT_EMAIL=dev@example.com
 */
export function getSupportEmail(): string {
  return (
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPPORT_EMAIL) ||
    ''
  ).trim();
}

export function openSupportEmail(userEmail?: string, userName?: string): void {
  const to = getSupportEmail();
  if (!to) {
    window.alert(
      'Adresse support non configurée. Ajoutez NEXT_PUBLIC_SUPPORT_EMAIL dans .env.local du frontend (ex: NEXT_PUBLIC_SUPPORT_EMAIL=mathisehouabolet@gmail.com).'
    );
    return;
  }
  const subject = encodeURIComponent('[Nexus Task] Demande support');
  const body = encodeURIComponent(
    [
      'Bonjour,',
      '',
      'Décrivez votre demande :',
      '',
      '',
      '---',
      userName ? `Utilisateur : ${userName}` : '',
      userEmail ? `E-mail : ${userEmail}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  );
  window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
}
