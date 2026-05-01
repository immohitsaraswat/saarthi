const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/firebase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ─── Helper: check if user is project admin ───────────────────────────────────
const getProjectAndCheckRole = async (projectId, userId, requiredRole = null) => {
  const projectDoc = await db.collection('projects').doc(projectId).get();
  if (!projectDoc.exists) return { error: 'Project not found.', status: 404 };

  const project = { id: projectDoc.id, ...projectDoc.data() };
  const memberEntry = project.members.find((m) => m.userId === userId);

  if (!memberEntry) return { error: 'Access denied. Not a project member.', status: 403 };
  if (requiredRole && memberEntry.role !== requiredRole) {
    return { error: 'Access denied. Admin role required.', status: 403 };
  }

  return { project, role: memberEntry.role };
};

// ─────────────────────────────────────────────
// GET /api/projects  – list user's projects
// ─────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const snapshot = await db
      .collection('projects')
      .where('memberIds', 'array-contains', req.user.id)
      .get();

    // Sort by createdAt descending in JS (avoids needing a composite Firestore index)
    const projects = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

    return res.status(200).json({ projects });
  } catch (err) {
    console.error('List projects error:', err);
    return res.status(500).json({ message: 'Failed to fetch projects.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/projects  – create project (creator = admin)
// ─────────────────────────────────────────────
router.post(
  '/',
  authMiddleware,
  [
    body('name').trim().notEmpty().withMessage('Project name is required'),
    body('description').optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { name, description = '' } = req.body;
      const userId = req.user.id;

      const projectRef = db.collection('projects').doc();
      const projectData = {
        name,
        description,
        createdBy: userId,
        members: [{ userId, role: 'admin' }],
        memberIds: [userId],            // denormalized for Firestore array-contains queries
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await projectRef.set(projectData);

      // Onboarding: mark createdProject
      db.collection('users').doc(userId).update({ 'onboarding.createdProject': true }).catch(() => {});

      return res.status(201).json({
        message: 'Project created.',
        project: { id: projectRef.id, ...projectData },
      });
    } catch (err) {
      console.error('Create project error:', err);
      return res.status(500).json({ message: 'Failed to create project.' });
    }
  }
);

// ─────────────────────────────────────────────
// GET /api/projects/:id  – get project details
// ─────────────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { project, error, status } = await getProjectAndCheckRole(req.params.id, req.user.id);
    if (error) return res.status(status).json({ message: error });

    // Enrich member list with user names/emails
    const enrichedMembers = await Promise.all(
      project.members.map(async (m) => {
        const userDoc = await db.collection('users').doc(m.userId).get();
        const uData = userDoc.exists ? userDoc.data() : {};
        return { userId: m.userId, role: m.role, name: uData.name, email: uData.email };
      })
    );

    return res.status(200).json({ project: { ...project, members: enrichedMembers } });
  } catch (err) {
    console.error('Get project error:', err);
    return res.status(500).json({ message: 'Failed to fetch project.' });
  }
});

// ─────────────────────────────────────────────
// PUT /api/projects/:id  – update project (admin only)
// ─────────────────────────────────────────────
router.put(
  '/:id',
  authMiddleware,
  [body('name').optional().trim().notEmpty()],
  async (req, res) => {
    try {
      const { error, status } = await getProjectAndCheckRole(req.params.id, req.user.id, 'admin');
      if (error) return res.status(status).json({ message: error });

      const { name, description } = req.body;
      const updates = { updatedAt: new Date().toISOString() };
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;

      await db.collection('projects').doc(req.params.id).update(updates);
      return res.status(200).json({ message: 'Project updated.' });
    } catch (err) {
      console.error('Update project error:', err);
      return res.status(500).json({ message: 'Failed to update project.' });
    }
  }
);

// ─────────────────────────────────────────────
// DELETE /api/projects/:id  – delete project (admin only)
// ─────────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { error, status } = await getProjectAndCheckRole(req.params.id, req.user.id, 'admin');
    if (error) return res.status(status).json({ message: error });

    // Delete all tasks for this project
    const tasksSnapshot = await db
      .collection('tasks')
      .where('projectId', '==', req.params.id)
      .get();

    const batch = db.batch();
    tasksSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    batch.delete(db.collection('projects').doc(req.params.id));
    await batch.commit();

    return res.status(200).json({ message: 'Project and its tasks deleted.' });
  } catch (err) {
    console.error('Delete project error:', err);
    return res.status(500).json({ message: 'Failed to delete project.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/projects/:id/members  – add member (admin only)
// ─────────────────────────────────────────────
router.post(
  '/:id/members',
  authMiddleware,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('role').optional().isIn(['admin', 'member']).withMessage('Role must be admin or member'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { project, error, status } = await getProjectAndCheckRole(
        req.params.id,
        req.user.id,
        'admin'
      );
      if (error) return res.status(status).json({ message: error });

      const { email, role = 'member' } = req.body;

      // Find user by email
      const userSnapshot = await db.collection('users').where('email', '==', email).limit(1).get();
      if (userSnapshot.empty) {
        return res.status(404).json({ message: 'No user found with that email.' });
      }

      const newMemberDoc = userSnapshot.docs[0];
      const newMemberId = newMemberDoc.id;

      // Check if already a member
      if (project.memberIds.includes(newMemberId)) {
        return res.status(400).json({ message: 'User is already a member of this project.' });
      }

      await db.collection('projects').doc(req.params.id).update({
        members: [...project.members, { userId: newMemberId, role }],
        memberIds: [...project.memberIds, newMemberId],
        updatedAt: new Date().toISOString(),
      });

      // Onboarding: mark invitedMember for the admin who invited
      db.collection('users').doc(req.user.id).update({ 'onboarding.invitedMember': true }).catch(() => {});

      return res.status(200).json({ message: `${newMemberDoc.data().name} added as ${role}.` });
    } catch (err) {
      console.error('Add member error:', err);
      return res.status(500).json({ message: 'Failed to add member.' });
    }
  }
);

// ─────────────────────────────────────────────
// DELETE /api/projects/:id/members/:userId  – remove member (admin only)
// ─────────────────────────────────────────────
router.delete('/:id/members/:userId', authMiddleware, async (req, res) => {
  try {
    const { project, error, status } = await getProjectAndCheckRole(
      req.params.id,
      req.user.id,
      'admin'
    );
    if (error) return res.status(status).json({ message: error });

    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Cannot remove yourself from the project.' });
    }

    const updatedMembers = project.members.filter((m) => m.userId !== userId);
    const updatedMemberIds = project.memberIds.filter((id) => id !== userId);

    await db.collection('projects').doc(req.params.id).update({
      members: updatedMembers,
      memberIds: updatedMemberIds,
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({ message: 'Member removed.' });
  } catch (err) {
    console.error('Remove member error:', err);
    return res.status(500).json({ message: 'Failed to remove member.' });
  }
});

module.exports = router;
