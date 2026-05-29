const requireCanInvite = async (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });
  if (req.user.role === 'admin') return next();
  return res.status(403).json({
    message: "Seuls les administrateurs peuvent envoyer des invitations.",
  });
};

async function userCanInvite(user) {
  return !!user && user.role === 'admin';
}

module.exports = { userCanInvite, requireCanInvite };
