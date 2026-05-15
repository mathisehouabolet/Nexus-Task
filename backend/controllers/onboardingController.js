const crypto = require('crypto');
const User = require('../models/User');
const Project = require('../models/Project');
const generateToken = require('../utils/generateToken');

function generateTempPassword() {
  return crypto.randomBytes(12).toString('hex');
}

function splitFullName(fullName) {
  const raw = String(fullName || '').trim().replace(/\s+/g, ' ');
  if (!raw) return { prenom: '', nom: '' };
  const parts = raw.split(' ');
  if (parts.length === 1) return { prenom: parts[0], nom: parts[0] };
  return { prenom: parts[0], nom: parts.slice(1).join(' ') };
}

function nameFromEmail(email) {
  const local = String(email || '').split('@')[0] || '';
  const cleaned = local.replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned || email;
}

function parseDueDate(value) {
  if (value == null || value === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// POST /api/onboarding/register
// Body: { fullName, email, password, project: { name, objective, due_date }, invites?: [{ email, fullName?, role? }] }
const registerWorkspace = async (req, res) => {
  try {
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      return res.status(400).json({
        message:
          "Onboarding dÃ©jÃ  effectuÃ©. Purgez d'abord les comptes si vous voulez recommencer.",
      });
    }

    const { fullName, email, password, project, invites } = req.body || {};
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'fullName, email, password are required' });
    }
    if (!project || !project.name) {
      return res
        .status(400)
        .json({ message: 'project.name is required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const { prenom, nom } = splitFullName(fullName);

    const owner = await User.create({
      nom,
      prenom,
      email: normalizedEmail,
      password: String(password),
      role: 'admin',
      is_online: false,
    });

    const createdInvites = [];
    const inviteRows = Array.isArray(invites) ? invites : [];
    for (const row of inviteRows) {
      const invEmail = String(row?.email || '').trim().toLowerCase();
      if (!invEmail) continue;
      const tempPassword = generateTempPassword();
      const invName = row?.fullName ? String(row.fullName) : nameFromEmail(invEmail);
      const invSplit = splitFullName(invName);
      const user = await User.create({
        nom: invSplit.nom,
        prenom: invSplit.prenom,
        email: invEmail,
        password: tempPassword,
        role: row?.role || 'user',
        is_online: false,
      });
      createdInvites.push({
        _id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        tempPassword,
      });
    }

    const proj = await Project.create({
      name: String(project.name).trim(),
      objective: String(project.objective || '').trim(),
      due_date: parseDueDate(project.due_date),
      createdBy: owner._id,
      members: [owner._id, ...createdInvites.map((u) => u._id)],
    });

    return res.status(201).json({
      user: {
        _id: owner._id,
        nom: owner.nom,
        prenom: owner.prenom,
        email: owner.email,
        role: owner.role,
        avatar_url: owner.avatar_url || '',
        job_role: owner.job_role || '',
        token: generateToken(owner._id),
      },
      project: {
        _id: proj._id,
        name: proj.name,
        objective: proj.objective,
        due_date: proj.due_date,
      },
      invited: createdInvites,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

module.exports = { registerWorkspace };

