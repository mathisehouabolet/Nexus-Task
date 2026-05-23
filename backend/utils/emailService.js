const { Resend } = require('resend');

function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key || key === 'votre_cle_api_resend_ici') return null;
  return new Resend(key);
}

/**
 * Envoie un email d'invitation à un utilisateur
 * @param {string} email - L'email du destinataire
 * @param {string} prenom - Le prénom (ou nom) du destinataire
 * @param {string} tempPassword - Le mot de passe temporaire généré
 */
const sendInvitationEmail = async (email, prenom, tempPassword) => {
  const resend = getResendClient();
  if (!resend) {
    console.warn(`⚠️ [Resend] Clé API non configurée. L'email d'invitation à ${email} n'a pas été envoyé.`);
    return { ok: false, reason: 'missing_api_key' };
  }

  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const from =
    process.env.RESEND_FROM || 'Nexus Task <onboarding@resend.dev>';

  const htmlTemplate = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #0d1117; color: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08);">
      <h1 style="color: #ffffff; font-size: 24px; margin-bottom: 8px;">Bienvenue sur Nexus Task !</h1>
      <p style="color: #94a3b8; font-size: 16px; margin-bottom: 24px;">
        Bonjour ${prenom},<br/><br/>
        Vous avez été invité(e) à rejoindre un espace de travail sur Nexus Task.
      </p>
      
      <div style="background-color: #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
        <p style="color: #cbd5e1; margin: 0 0 8px 0; font-size: 14px;">Vos identifiants de connexion :</p>
        <p style="margin: 0 0 4px 0;"><strong>Email :</strong> <a href="mailto:${email}" style="color: #7c5cfc;">${email}</a></p>
        <p style="margin: 0;"><strong>Mot de passe temporaire :</strong> <span style="font-family: monospace; background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px; color: #a78bfa;">${tempPassword}</span></p>
      </div>

      <p style="color: #94a3b8; font-size: 14px; margin-bottom: 32px;">
        Nous vous recommandons de changer ce mot de passe dès votre première connexion.
      </p>

      <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(90deg, #7c5cfc 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: bold; font-size: 14px;">
        Accéder à Nexus Task
      </a>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); text-align: center;">
        <p style="color: #64748b; font-size: 12px; margin: 0;">
          Cet email est généré automatiquement. Merci de ne pas y répondre.
        </p>
      </div>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [email],
      subject: '🚀 Bienvenue sur Nexus Task - Vos accès',
      html: htmlTemplate,
    });

    if (error) {
      console.error(`❌ [Resend] Échec envoi à ${email}:`, error.message || error);
      return { ok: false, reason: 'resend_error', error };
    }

    console.log(`✅ Email envoyé à ${email} (ID: ${data?.id})`);
    return { ok: true, id: data?.id };
  } catch (error) {
    console.error(`❌ Erreur lors de l'envoi de l'email à ${email}:`, error);
    return { ok: false, reason: 'exception', error };
  }
};

function isSandboxFromAddress(from) {
  return !from || from.includes('@resend.dev');
}

module.exports = {
  sendInvitationEmail,
  isSandboxFromAddress,
};
