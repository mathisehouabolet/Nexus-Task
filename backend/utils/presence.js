/** Durée sans ping avant de considérer un membre hors ligne */
const ONLINE_THRESHOLD_MS = 90_000;

function isUserOnline(user) {
  if (!user) return false;
  if (user.lastSeenAt) {
    return Date.now() - new Date(user.lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;
  }
  return !!user.is_online;
}

function withOnlineStatus(users) {
  return (users || []).map((u) => ({
    ...u,
    is_online: isUserOnline(u),
  }));
}

function onlineSinceDate() {
  return new Date(Date.now() - ONLINE_THRESHOLD_MS);
}

module.exports = {
  ONLINE_THRESHOLD_MS,
  isUserOnline,
  withOnlineStatus,
  onlineSinceDate,
};
