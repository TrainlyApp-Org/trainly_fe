import express from 'express';
import { getSupabaseClientForUser } from '../supabaseClient.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { mockDb } from '../mockDb.js';

const router = express.Router();

// 1. START A WORKOUT SESSION
router.post('/start', requireAuth, async (req, res) => {
  const { workoutPlanId, workoutDayId } = req.body;

  if (global.useMockDatabase) {
    const logId = 'log-' + Math.random().toString(36).substr(2, 9);
    const newLog = {
      id: logId,
      profile_id: req.user.id,
      workout_plan_id: workoutPlanId || null,
      workout_day_id: workoutDayId || null,
      started_at: new Date().toISOString(),
      completed_at: null
    };

    mockDb.workout_logs[logId] = newLog;
    mockDb.workout_log_details[logId] = []; // initialize set logging container

    return res.status(201).json({ message: 'Workout started (MOCK MODE)', logId });
  }

  try {
    const userClient = getSupabaseClientForUser(req.headers.authorization);
    
    const { data: log, error } = await userClient
      .from('workout_logs')
      .insert({
        profile_id: req.user.id,
        workout_plan_id: workoutPlanId || null,
        workout_day_id: workoutDayId || null,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({ message: 'Workout started', logId: log.id });
  } catch (err) {
    console.error('Start workout error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. LOG / UPDATE A SET IN AN ACTIVE WORKOUT
router.post('/set', requireAuth, async (req, res) => {
  const { workoutLogId, exerciseId, setIndex, reps, weight, completed } = req.body;

  if (!workoutLogId || !exerciseId || setIndex === undefined) {
    return res.status(400).json({ error: 'workoutLogId, exerciseId and setIndex are required.' });
  }

  if (global.useMockDatabase) {
    const log = mockDb.workout_logs[workoutLogId];
    if (!log || log.profile_id !== req.user.id) {
      return res.status(404).json({ error: 'Workout session not found.' });
    }

    let logSets = mockDb.workout_log_details[workoutLogId];
    if (!logSets) {
      logSets = [];
      mockDb.workout_log_details[workoutLogId] = logSets;
    }

    let existingSetIndex = logSets.findIndex(s => s.exercise_id === exerciseId && s.set_index === setIndex);
    
    const setDetails = {
      id: `set-det-${workoutLogId}-${exerciseId}-${setIndex}`,
      workout_log_id: workoutLogId,
      exercise_id: exerciseId,
      set_index: setIndex,
      reps: reps || 0,
      weight: weight || 0,
      completed: completed !== undefined ? completed : true,
      created_at: new Date().toISOString()
    };

    if (existingSetIndex >= 0) {
      logSets[existingSetIndex] = setDetails;
    } else {
      logSets.push(setDetails);
    }

    return res.status(200).json({ message: 'Set logged (MOCK MODE)', set: setDetails });
  }

  try {
    const userClient = getSupabaseClientForUser(req.headers.authorization);

    const { data: existingSet, error: fetchError } = await userClient
      .from('workout_log_details')
      .select('id')
      .eq('workout_log_id', workoutLogId)
      .eq('exercise_id', exerciseId)
      .eq('set_index', setIndex)
      .maybeSingle();

    if (fetchError) {
      return res.status(400).json({ error: fetchError.message });
    }

    let result;
    if (existingSet) {
      const { data, error } = await userClient
        .from('workout_log_details')
        .update({
          reps: reps || 0,
          weight: weight || 0,
          completed: completed !== undefined ? completed : true
        })
        .eq('id', existingSet.id)
        .select()
        .single();
      
      if (error) return res.status(400).json({ error: error.message });
      result = data;
    } else {
      const { data, error } = await userClient
        .from('workout_log_details')
        .insert({
          workout_log_id: workoutLogId,
          exercise_id: exerciseId,
          set_index: setIndex,
          reps: reps || 0,
          weight: weight || 0,
          completed: completed !== undefined ? completed : true
        })
        .select()
        .single();
      
      if (error) return res.status(400).json({ error: error.message });
      result = data;
    }

    return res.status(200).json({ message: 'Set logged successfully', set: result });
  } catch (err) {
    console.error('Log set error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. GET ACTIVE WORKOUT LOG FOR PLAN + DAY
router.get('/active', requireAuth, async (req, res) => {
  const { workoutPlanId, workoutDayId } = req.query;

  if (!workoutPlanId || !workoutDayId) {
    return res.status(400).json({ error: 'workoutPlanId and workoutDayId are required.' });
  }

  if (global.useMockDatabase) {
    const activeLog = Object.values(mockDb.workout_logs).find(log =>
      log.profile_id === req.user.id &&
      log.workout_plan_id === workoutPlanId &&
      log.workout_day_id === workoutDayId &&
      !log.completed_at
    );

    if (!activeLog) {
      return res.status(404).json({ error: 'Active workout log not found.' });
    }

    const logSets = mockDb.workout_log_details[activeLog.id] || [];
    return res.status(200).json({ logId: activeLog.id, details: logSets });
  }

  try {
    const userClient = getSupabaseClientForUser(req.headers.authorization);

    const { data: activeLog, error: logError } = await userClient
      .from('workout_logs')
      .select('*')
      .eq('profile_id', req.user.id)
      .eq('workout_plan_id', workoutPlanId)
      .eq('workout_day_id', workoutDayId)
      .is('completed_at', null)
      .maybeSingle();

    if (logError) {
      return res.status(400).json({ error: logError.message });
    }

    if (!activeLog) {
      return res.status(404).json({ error: 'Active workout log not found.' });
    }

    const { data: details, error: detailsError } = await userClient
      .from('workout_log_details')
      .select('exercise_id,set_index,reps,weight,completed')
      .eq('workout_log_id', activeLog.id);

    if (detailsError) {
      return res.status(400).json({ error: detailsError.message });
    }

    return res.status(200).json({ logId: activeLog.id, details });
  } catch (err) {
    console.error('Get active workout log error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. COMPLETE A WORKOUT SESSION
router.post('/complete', requireAuth, async (req, res) => {
  const { workoutLogId } = req.body;

  if (!workoutLogId) {
    return res.status(400).json({ error: 'workoutLogId is required.' });
  }

  if (global.useMockDatabase) {
    const log = mockDb.workout_logs[workoutLogId];
    if (!log || log.profile_id !== req.user.id) {
      return res.status(404).json({ error: 'Workout session not found.' });
    }

    log.completed_at = new Date().toISOString();
    return res.status(200).json({ message: 'Workout completed (MOCK MODE)', log });
  }

  try {
    const userClient = getSupabaseClientForUser(req.headers.authorization);

    const { data: log, error } = await userClient
      .from('workout_logs')
      .update({
        completed_at: new Date().toISOString()
      })
      .eq('id', workoutLogId)
      .eq('profile_id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Workout completed successfully', log });
  } catch (err) {
    console.error('Complete workout error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. GET WORKOUT HISTORY FOR CURRENT USER
router.get('/history', requireAuth, async (req, res) => {
  if (global.useMockDatabase) {
    const history = Object.values(mockDb.workout_logs)
      .filter(log => log.profile_id === req.user.id && log.completed_at !== null)
      .map(log => {
        const plan = log.workout_plan_id ? mockDb.workout_plans[log.workout_plan_id] : null;
        return {
          id: log.id,
          started_at: log.started_at,
          completed_at: log.completed_at,
          workout_plan: plan ? { id: plan.id, name: plan.name } : null
        };
      })
      .sort((a, b) => new Date(b.started_at) - new Date(a.started_at));

    return res.status(200).json({ history });
  }

  try {
    const userClient = getSupabaseClientForUser(req.headers.authorization);

    const { data: logs, error } = await userClient
      .from('workout_logs')
      .select(`
        id,
        started_at,
        completed_at,
        workout_plan:workout_plans (
          id,
          name
        )
      `)
      .eq('profile_id', req.user.id)
      .not('completed_at', 'is', null)
      .order('started_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ history: logs });
  } catch (err) {
    console.error('Get workout history error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 5. GET DETAIL OF A COMPLETED WORKOUT
router.get('/history/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  if (global.useMockDatabase) {
    const log = mockDb.workout_logs[id];
    if (!log || log.profile_id !== req.user.id) {
      return res.status(404).json({ error: 'Workout session not found.' });
    }

    const plan = log.workout_plan_id ? mockDb.workout_plans[log.workout_plan_id] : null;
    const logSets = mockDb.workout_log_details[id] || [];

    // Group sets by exercise
    const exercisesMap = {};
    logSets.forEach(item => {
      const exId = item.exercise_id;
      const exercise = mockDb.exercises.find(e => e.id === exId);
      if (!exercise) return;

      if (!exercisesMap[exId]) {
        exercisesMap[exId] = {
          id: exId,
          name: exercise.name,
          category_id: exercise.category_id,
          sets: []
        };
      }

      exercisesMap[exId].sets.push({
        id: item.id,
        set_index: item.set_index,
        reps: item.reps,
        weight: item.weight,
        completed: item.completed
      });
    });

    return res.status(200).json({
      id: log.id,
      started_at: log.started_at,
      completed_at: log.completed_at,
      workout_plan: plan ? { id: plan.id, name: plan.name } : null,
      loggedExercises: Object.values(exercisesMap)
    });
  }

  try {
    const userClient = getSupabaseClientForUser(req.headers.authorization);

    // Get log main details
    const { data: log, error: logError } = await userClient
      .from('workout_logs')
      .select(`
        id,
        started_at,
        completed_at,
        workout_plan:workout_plans (
          id,
          name
        )
      `)
      .eq('id', id)
      .eq('profile_id', req.user.id)
      .single();

    if (logError || !log) {
      return res.status(404).json({ error: 'Workout session not found.' });
    }

    // Get logged sets details
    const { data: details, error: detailsError } = await userClient
      .from('workout_log_details')
      .select(`
        id,
        set_index,
        reps,
        weight,
        completed,
        exercise:exercises (
          id,
          name,
          category_id
        )
      `)
      .eq('workout_log_id', id)
      .order('created_at');

    if (detailsError) {
      return res.status(400).json({ error: detailsError.message });
    }

    // Format sets by exercise
    const exercisesMap = {};
    details.forEach(item => {
      const exId = item.exercise?.id;
      if (!exId) return;

      if (!exercisesMap[exId]) {
        exercisesMap[exId] = {
          id: exId,
          name: item.exercise.name,
          category_id: item.exercise.category_id,
          sets: []
        };
      }

      exercisesMap[exId].sets.push({
        id: item.id,
        set_index: item.set_index,
        reps: item.reps,
        weight: item.weight,
        completed: item.completed
      });
    });

    return res.status(200).json({
      ...log,
      loggedExercises: Object.values(exercisesMap)
    });
  } catch (err) {
    console.error('Get workout history details error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
