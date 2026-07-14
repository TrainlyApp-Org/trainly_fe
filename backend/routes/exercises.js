import express from 'express';
import { getSupabaseClientForUser } from '../supabaseClient.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { mockDb } from '../mockDb.js';

const router = express.Router();

// 1. GET ALL CATEGORIES
router.get('/categories', requireAuth, async (req, res) => {
  if (global.useMockDatabase) {
    return res.status(200).json({ categories: mockDb.categories });
  }

  try {
    const userClient = getSupabaseClientForUser(req.headers.authorization);
    const { data, error } = await userClient
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ categories: data });
  } catch (err) {
    console.error('Get categories error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. GET ALL EXERCISES (standard library + user-created custom)
router.get('/', requireAuth, async (req, res) => {
  if (global.useMockDatabase) {
    // Filter exercises: default ones (is_custom = false) or user created (is_custom = true && created_by = user.id)
    const userExercises = mockDb.exercises.filter(ex => 
      ex.is_custom === false || ex.created_by === req.user.id
    );
    return res.status(200).json({ exercises: userExercises });
  }

  try {
    const userClient = getSupabaseClientForUser(req.headers.authorization);
    const { data, error } = await userClient
      .from('exercises')
      .select('*')
      .order('name');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ exercises: data });
  } catch (err) {
    console.error('Get exercises error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. CREATE CUSTOM EXERCISE
router.post('/', requireAuth, async (req, res) => {
  const { name, categoryId, description } = req.body;

  if (!name || !categoryId) {
    return res.status(400).json({ error: 'Exercise name and categoryId are required.' });
  }

  if (global.useMockDatabase) {
    const newExercise = {
      id: 'ex-' + Math.random().toString(36).substr(2, 9),
      name,
      category_id: categoryId,
      description: description || '',
      is_custom: true,
      created_by: req.user.id
    };

    mockDb.exercises.push(newExercise);
    return res.status(201).json({ message: 'Custom exercise created (MOCK MODE)', exercise: newExercise });
  }

  try {
    const userClient = getSupabaseClientForUser(req.headers.authorization);
    const { data, error } = await userClient
      .from('exercises')
      .insert({
        name,
        category_id: categoryId,
        description: description || '',
        is_custom: true,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({ message: 'Custom exercise created successfully', exercise: data });
  } catch (err) {
    console.error('Create custom exercise error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
