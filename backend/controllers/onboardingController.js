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
// Body: { fullName, email, password, project?: { name, objective, due_date }, invites?: [{ email, fullName?, role? }], projectId?: string }
const registerWorkspace = async (req, res) => {
  try {
    const { fullName, email, password, project, invites, projectId } = req.body || {};
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'fullName, email, password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'Un compte avec cet email existe déjà.' });
    }
    const { prenom, nom } = splitFullName(fullName);

    // Case 1: Joining an existing project via invitation link
    if (projectId) {
      const existingProject = await Project.findById(projectId);
      if (!existingProject) {
        return res.status(404).json({ message: 'Le projet spécifié est introuvable ou a été supprimé.' });
      }

      const user = await User.create({
        nom,
        prenom,
        email: normalizedEmail,
        password: String(password),
        role: 'user',
        projectId: existingProject._id,
        is_online: false,
      });

      await Project.updateOne(
        { _id: existingProject._id },
        { $addToSet: { members: user._id } }
      );

      return res.status(201).json({
        user: {
          _id: user._id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          role: user.role,
          avatar_url: user.avatar_url || '',
          job_role: user.job_role || '',
          projectId: existingProject._id,
          token: generateToken(user._id),
        },
        project: {
          _id: existingProject._id,
          name: existingProject.name,
          objective: existingProject.objective,
          due_date: existingProject.due_date,
        },
        invited: [],
      });
    }

    // Case 2: Standard registration with a new workspace and project
    if (!project || !project.name) {
      return res
        .status(400)
        .json({ message: 'project.name is required' });
    }

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
        projectId: null,
      });

      createdInvites.push({
        _id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        tempPassword,
        emailSent: false,
        emailError: null,
      });
    }

    const proj = await Project.create({
      name: String(project.name).trim(),
      objective: String(project.objective || '').trim(),
      due_date: parseDueDate(project.due_date),
      createdBy: owner._id,
      members: [owner._id, ...createdInvites.map((u) => u._id)],
    });

    await User.updateOne({ _id: owner._id }, { projectId: proj._id });
    if (createdInvites.length) {
      await User.updateMany(
        { _id: { $in: createdInvites.map((u) => u._id) } },
        { projectId: proj._id }
      );
    }

    return res.status(201).json({
      user: {
        _id: owner._id,
        nom: owner.nom,
        prenom: owner.prenom,
        email: owner.email,
        role: owner.role,
        avatar_url: owner.avatar_url || '',
        job_role: owner.job_role || '',
        projectId: proj._id,
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

// GET /api/onboarding/project/:id
const getProjectInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const proj = await Project.findById(id).select('name').lean();
    if (!proj) {
      return res.status(404).json({ message: 'Projet introuvable.' });
    }
    res.json({ name: proj.name });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = { registerWorkspace, getProjectInfo };

