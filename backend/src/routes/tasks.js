const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { db } = require('../config/firebase');
const authMiddleware = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// ─── Helper: verify project membership & return role ─────────────────────────
const verifyProjectAccess = async (projectId, userId) => {
  const projectDoc = await db.collection('projects').doc(projectId).get();
  if (!projectDoc.exists) return { error: 'Project not found.', status: 404 };

  const project = { id: projectDoc.id, ...projectDoc.data() };
  const member = project.members.find((m) => m.userId === userId);
  if (!member) return { error: 'Access denied. Not a project member.', status: 403 };

  return { project, role: member.role };
};

// ─────────────────────────────────────────────
// GET /api/projects/:id/tasks  – list tasks (with filters)
// ─────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { error, status } = await verifyProjectAccess(req.params.id, req.user.id);
    if (error) return res.status(status).json({ message: error });

    const { status: taskStatus, priority, assignedTo, search } = req.query;

    let tasksQuery = db.collection('tasks').where('projectId', '==', req.params.id);

    if (taskStatus) tasksQuery = tasksQuery.where('status', '==', taskStatus);
    if (priority) tasksQuery = tasksQuery.where('priority', '==', priority);
    if (assignedTo) tasksQuery = tasksQuery.where('assignedTo', '==', assignedTo);

    const snapshot = await tasksQuery.get();
    let tasks = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

    // Client-side search on title (Firestore doesn't support full-text search natively)
    if (search) {
      const lowerSearch = search.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(lowerSearch) ||
          (t.description && t.description.toLowerCase().includes(lowerSearch))
      );
    }

    return res.status(200).json({ tasks });
  } catch (err) {
    console.error('List tasks error:', err);
    return res.status(500).json({ message: 'Failed to fetch tasks.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/projects/:id/tasks  – create task (admin only)
// ─────────────────────────────────────────────
router.post(
  '/',
  authMiddleware,
  [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('description').optional().trim(),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Priority must be low, medium, or high'),
    body('status')
      .optional()
      .isIn(['todo', 'inprogress', 'done'])
      .withMessage('Invalid status value'),
    body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid date format'),
    body('assignedTo').optional({ nullable: true }).isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { role, error, status: errStatus } = await verifyProjectAccess(
        req.params.id,
        req.user.id
      );
      if (error) return res.status(errStatus).json({ message: error });

      if (role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can create tasks.' });
      }

      const { title, description = '', priority = 'medium', status = 'todo', dueDate = null, assignedTo = null } = req.body;

      const taskRef = db.collection('tasks').doc();
      const taskData = {
        projectId: req.params.id,
        title,
        description,
        priority,
        status,
        dueDate,
        assignedTo,
        createdBy: req.user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await taskRef.set(taskData);

      // Onboarding: mark createdTask
      db.collection('users').doc(req.user.id).update({ 'onboarding.createdTask': true }).catch(() => {});

      return res.status(201).json({ message: 'Task created.', task: { id: taskRef.id, ...taskData } });
    } catch (err) {
      console.error('Create task error:', err);
      return res.status(500).json({ message: 'Failed to create task.' });
    }
  }
);

// ─────────────────────────────────────────────
// GET /api/tasks/:taskId  – get single task
// ─────────────────────────────────────────────
router.get('/:taskId', authMiddleware, async (req, res) => {
  try {
    const taskDoc = await db.collection('tasks').doc(req.params.taskId).get();
    if (!taskDoc.exists) return res.status(404).json({ message: 'Task not found.' });

    const task = { id: taskDoc.id, ...taskDoc.data() };

    const { error, status } = await verifyProjectAccess(task.projectId, req.user.id);
    if (error) return res.status(status).json({ message: error });

    return res.status(200).json({ task });
  } catch (err) {
    console.error('Get task error:', err);
    return res.status(500).json({ message: 'Failed to fetch task.' });
  }
});

// ─────────────────────────────────────────────
// PUT /api/tasks/:taskId  – update task
//   Admin: can update all fields
//   Member: can only update status (if assigned to them)
// ─────────────────────────────────────────────
router.put(
  '/:taskId',
  authMiddleware,
  [
    body('title').optional().trim().notEmpty(),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('status').optional().isIn(['todo', 'inprogress', 'done']),
    body('dueDate').optional({ nullable: true }).isISO8601(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const taskDoc = await db.collection('tasks').doc(req.params.taskId).get();
      if (!taskDoc.exists) return res.status(404).json({ message: 'Task not found.' });

      const task = { id: taskDoc.id, ...taskDoc.data() };

      const { role, error, status: errStatus } = await verifyProjectAccess(
        task.projectId,
        req.user.id
      );
      if (error) return res.status(errStatus).json({ message: error });

      const { title, description, priority, status, dueDate, assignedTo } = req.body;
      let updates = { updatedAt: new Date().toISOString() };

      if (role === 'admin') {
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (priority !== undefined) updates.priority = priority;
        if (status !== undefined) updates.status = status;
        if (dueDate !== undefined) updates.dueDate = dueDate;
        if (assignedTo !== undefined) updates.assignedTo = assignedTo;
      } else {
        if (task.assignedTo !== req.user.id) {
          return res.status(403).json({ message: 'You can only update tasks assigned to you.' });
        }
        // Only apply status — silently ignore any other fields
        if (status !== undefined) updates.status = status;
      }

      await db.collection('tasks').doc(req.params.taskId).update(updates);

      // Log activity if status changed
      if (status !== undefined && status !== task.status) {
        const STATUS_LABELS = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' };
        await db.collection('tasks').doc(req.params.taskId).collection('activity').add({
          type: 'status_change',
          from: task.status,
          to: status,
          fromLabel: STATUS_LABELS[task.status] || task.status,
          toLabel: STATUS_LABELS[status] || status,
          userId: req.user.id,
          userName: req.user.name,
          createdAt: new Date().toISOString(),
        });
      }

      return res.status(200).json({ message: 'Task updated.', updates });
    } catch (err) {
      console.error('Update task error:', err);
      return res.status(500).json({ message: 'Failed to update task.' });
    }
  }
);

// ─────────────────────────────────────────────
// DELETE /api/tasks/:taskId  – delete task (admin only)
// ─────────────────────────────────────────────
router.delete('/:taskId', authMiddleware, async (req, res) => {
  try {
    const taskDoc = await db.collection('tasks').doc(req.params.taskId).get();
    if (!taskDoc.exists) return res.status(404).json({ message: 'Task not found.' });

    const task = taskDoc.data();
    const { role, error, status } = await verifyProjectAccess(task.projectId, req.user.id);
    if (error) return res.status(status).json({ message: error });

    if (role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete tasks.' });
    }

    await db.collection('tasks').doc(req.params.taskId).delete();
    return res.status(200).json({ message: 'Task deleted.' });
  } catch (err) {
    console.error('Delete task error:', err);
    return res.status(500).json({ message: 'Failed to delete task.' });
  }
});

// ─────────────────────────────────────────────
// GET /api/tasks/:taskId/comments  – list comments + activity
// ─────────────────────────────────────────────
router.get('/:taskId/comments', authMiddleware, async (req, res) => {
  try {
    const taskDoc = await db.collection('tasks').doc(req.params.taskId).get();
    if (!taskDoc.exists) return res.status(404).json({ message: 'Task not found.' });

    const task = { id: taskDoc.id, ...taskDoc.data() };
    const { error, status } = await verifyProjectAccess(task.projectId, req.user.id);
    if (error) return res.status(status).json({ message: error });

    const [commentsSnap, activitySnap] = await Promise.all([
      db.collection('tasks').doc(req.params.taskId).collection('comments').get(),
      db.collection('tasks').doc(req.params.taskId).collection('activity').get(),
    ]);

    const comments = commentsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));

    const activity = activitySnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));

    return res.status(200).json({ comments, activity });
  } catch (err) {
    console.error('List comments error:', err);
    return res.status(500).json({ message: 'Failed to fetch comments.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/tasks/:taskId/comments  – add comment (any member)
// ─────────────────────────────────────────────
router.post('/:taskId/comments', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text is required.' });

    const taskDoc = await db.collection('tasks').doc(req.params.taskId).get();
    if (!taskDoc.exists) return res.status(404).json({ message: 'Task not found.' });

    const task = { id: taskDoc.id, ...taskDoc.data() };
    const { error, status } = await verifyProjectAccess(task.projectId, req.user.id);
    if (error) return res.status(status).json({ message: error });

    const commentRef = db.collection('tasks').doc(req.params.taskId).collection('comments').doc();
    const commentData = {
      text: text.trim(),
      userId: req.user.id,
      userName: req.user.name,
      createdAt: new Date().toISOString(),
    };
    await commentRef.set(commentData);

    return res.status(201).json({ comment: { id: commentRef.id, ...commentData } });
  } catch (err) {
    console.error('Add comment error:', err);
    return res.status(500).json({ message: 'Failed to add comment.' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/tasks/:taskId/comments/:commentId
// ─────────────────────────────────────────────
router.delete('/:taskId/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    const taskDoc = await db.collection('tasks').doc(req.params.taskId).get();
    if (!taskDoc.exists) return res.status(404).json({ message: 'Task not found.' });

    const task = { id: taskDoc.id, ...taskDoc.data() };
    const { role, error, status } = await verifyProjectAccess(task.projectId, req.user.id);
    if (error) return res.status(status).json({ message: error });

    const commentRef = db
      .collection('tasks').doc(req.params.taskId)
      .collection('comments').doc(req.params.commentId);
    const commentDoc = await commentRef.get();
    if (!commentDoc.exists) return res.status(404).json({ message: 'Comment not found.' });

    const comment = commentDoc.data();
    if (role !== 'admin' && comment.userId !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own comments.' });
    }

    await commentRef.delete();
    return res.status(200).json({ message: 'Comment deleted.' });
  } catch (err) {
    console.error('Delete comment error:', err);
    return res.status(500).json({ message: 'Failed to delete comment.' });
  }
});

module.exports = router;
