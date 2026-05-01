const express = require('express');
const { db } = require('../config/firebase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ─────────────────────────────────────────────
// GET /api/dashboard
// Returns aggregated stats for the requesting user's projects + tasks
// ─────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch all projects this user belongs to
    const projectsSnapshot = await db
      .collection('projects')
      .where('memberIds', 'array-contains', userId)
      .get();

    const projectIds = projectsSnapshot.docs.map((d) => d.id);
    const projects = projectsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (projectIds.length === 0) {
      return res.status(200).json({
        totalProjects: 0,
        totalTasks: 0,
        tasksByStatus: { todo: 0, inprogress: 0, done: 0 },
        tasksByPriority: { low: 0, medium: 0, high: 0 },
        tasksByUser: [],
        overdueTasks: [],
        dueSoonTasks: [],
      });
    }

    // 2. Fetch all tasks across user's projects (Firestore supports max 30 in 'in' query → batch if needed)
    const batchSize = 10;
    let allTasks = [];

    for (let i = 0; i < projectIds.length; i += batchSize) {
      const batch = projectIds.slice(i, i + batchSize);
      const snapshot = await db
        .collection('tasks')
        .where('projectId', 'in', batch)
        .get();
      allTasks = allTasks.concat(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    }

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // 3. Aggregate stats
    const tasksByStatus = { todo: 0, inprogress: 0, done: 0 };
    const tasksByPriority = { low: 0, medium: 0, high: 0 };
    const tasksByUserMap = {};
    const overdueTasks = [];
    const dueSoonTasks = [];

    allTasks.forEach((task) => {
      // Status count
      if (tasksByStatus[task.status] !== undefined) tasksByStatus[task.status]++;

      // Priority count
      if (tasksByPriority[task.priority] !== undefined) tasksByPriority[task.priority]++;

      // Per-user count
      if (task.assignedTo) {
        tasksByUserMap[task.assignedTo] = (tasksByUserMap[task.assignedTo] || 0) + 1;
      }

      // Overdue / Due soon
      if (task.dueDate && task.status !== 'done') {
        const due = new Date(task.dueDate);
        if (due < now) {
          overdueTasks.push(task);
        } else if (due <= threeDaysFromNow) {
          dueSoonTasks.push(task);
        }
      }
    });

    // 4. Enrich tasksByUser with user names
    const userIdList = Object.keys(tasksByUserMap);
    const userNames = {};
    await Promise.all(
      userIdList.map(async (uid) => {
        const userDoc = await db.collection('users').doc(uid).get();
        userNames[uid] = userDoc.exists ? userDoc.data().name : 'Unknown';
      })
    );

    const tasksByUser = userIdList.map((uid) => ({
      userId: uid,
      name: userNames[uid],
      count: tasksByUserMap[uid],
    }));

    return res.status(200).json({
      totalProjects: projectIds.length,
      totalTasks: allTasks.length,
      tasksByStatus,
      tasksByPriority,
      tasksByUser,
      overdueTasks: overdueTasks.slice(0, 10),   // limit response size
      dueSoonTasks: dueSoonTasks.slice(0, 10),
      recentProjects: projects.slice(0, 5),
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ message: 'Failed to fetch dashboard data.' });
  }
});

module.exports = router;
