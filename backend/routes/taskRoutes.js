const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireWorkspace } = require('../middleware/projectMiddleware');
const { createTask, updateTask, listTasks, deleteTask } = require('../controllers/taskController');

router.use(protect, requireWorkspace);

router.get('/', listTasks);
router.post('/', createTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
