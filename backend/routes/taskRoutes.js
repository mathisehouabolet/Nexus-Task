const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createTask, updateTask, listTasks, deleteTask } = require('../controllers/taskController');

router.get('/', protect, listTasks);
router.post('/', protect, createTask);
router.patch('/:id', protect, updateTask);
router.delete('/:id', protect, deleteTask);

module.exports = router;
