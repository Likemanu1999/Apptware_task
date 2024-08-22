const express = require('express');
const Todo = require('../models/Todos');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Create 
router.post('/', authMiddleware, async (req, res) => {
    const { task } = req.body;
    try {
        const newTodo = new Todo({ user: req.user.id, task })
        const todo = await newTodo.save();
        res.json(todo);
    } catch (error) {
        console.log(error);
    }
})

//get
router.get('/', authMiddleware, async (req, res) => {
    try {
        const todos = await Todo.find({ user: req.user.id });
        res.json(todos);
    } catch (error) {
        console.log(error);
    }
})

// update 
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { task, completed } = req.body;
        let todo = await Todo.findById(req.params.id);
        if (!todo) {
            return res.status(404).json({ message: 'Todo not fount' })
        }
        if (todo.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not Authorized' })
        }
        todo = await Todo.findByIdAndUpdate(req.params.id, { task, completed }, { new: true })
        res.json(todo);
    } catch (error) {
        console.error(error)
    }
})


// delete 
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const todo = await Todo.findById(req.params.id);
      if (!todo) {
        return res.status(404).json({ message: 'Todo not found' });
      }
  
      if (todo.user.toString() !== req.user.id) {
        return res.status(401).json({ message: 'Not authorized' });
      }
  
      await Todo.findByIdAndDelete(req.params.id);
      res.json({ message: 'Todo removed' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });
  

module.exports = router;