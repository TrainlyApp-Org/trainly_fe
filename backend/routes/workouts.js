import express from 'express';
import { getSupabaseClientForUser, supabaseAdmin } from '../supabaseClient.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { mockDb } from '../mockDb.js';

const router = express.Router();

const normaliseDays = (days, exercises = []) => {
  const source = Array.isArray(days) && days.length ? days : [{ id: 'day-1', name: 'Giorno 1', exercises }];
  return source.map((day, dayIndex) => ({
    id: day.id || `day-${dayIndex + 1}`,
    name: String(day.name || `Giorno ${dayIndex + 1}`).trim(),
    orderIndex: dayIndex,
    exercises: (day.exercises || []).map((ex, index) => ({
      exercise_id: ex.exercise_id,
      sets: ex.sets || 3,
      reps: ex.reps !== undefined ? String(ex.reps) : '10',
      restTime: ex.restTime !== undefined ? parseInt(ex.restTime) : 60,
      weight: ex.weight !== undefined ? Number(ex.weight) : 0,
      set_values: Array.isArray(ex.set_values) ? ex.set_values.map(value => ({ weight: Number(value.weight) || 0, reps: Number(value.reps) || 0 })) : [],
      orderIndex: index
    }))
  }));
};

const formatMockDays = (days) => days.map(day => ({
  ...day,
  exercises: day.exercises.map((item, index) => {
    const exercise = mockDb.exercises.find(ex => ex.id === item.exercise_id);
    return { id: `plan-ex-${day.id}-${index}`, ...item, name: exercise?.name || 'Unknown Exercise', description: exercise?.description || '', category_id: exercise?.category_id || '' };
  })
}));

const createShareId = () => crypto.randomUUID();

const formatPublicDays = async (client, days) => {
  const normalised = normaliseDays(days);
  const ids = normalised.flatMap(day => day.exercises.map(exercise => exercise.exercise_id));
  const { data: library, error } = await client.from('exercises').select('id, name, description, category_id').in('id', ids);
  if (error) throw error;
  const byId = new Map((library || []).map(exercise => [exercise.id, exercise]));
  return normalised.map(day => ({ ...day, exercises: day.exercises.map((item, index) => ({ id: `shared-${day.id}-${index}`, ...item, name: byId.get(item.exercise_id)?.name || 'Esercizio', description: byId.get(item.exercise_id)?.description || '', category_id: byId.get(item.exercise_id)?.category_id || '' })) }));
};

// Public read-only access for a plan explicitly shared by its owner.
router.get('/public/:shareId', async (req, res) => {
  try {
    if (global.useMockDatabase) {
      const plan = Object.values(mockDb.workout_plans).find(item => item.share_id === req.params.shareId);
      if (!plan) return res.status(404).json({ error: 'Scheda condivisa non trovata.' });
      const days = formatMockDays(plan.days || normaliseDays(null, plan.exercises || []));
      return res.status(200).json({ id: plan.id, name: plan.name, description: plan.description, days, activeDay: days[0], exercises: days[0]?.exercises || [] });
    }
    if (!supabaseAdmin) return res.status(503).json({ error: 'Condivisione non configurata sul server.' });
    const { data: plan, error } = await supabaseAdmin.from('workout_plans').select('id, name, description, days').eq('share_id', req.params.shareId).maybeSingle();
    if (error || !plan) return res.status(404).json({ error: 'Scheda condivisa non trovata.' });
    const days = await formatPublicDays(supabaseAdmin, plan.days);
    return res.status(200).json({ ...plan, days, activeDay: days[0], exercises: days[0]?.exercises || [] });
  } catch (err) {
    console.error('Get shared workout error:', err);
    return res.status(500).json({ error: 'Impossibile caricare la scheda condivisa.' });
  }
});

// A share link may update the weight and reps of exactly one set on the shared routine.
router.post('/public/:shareId/weight', async (req, res) => {
  const { dayId, exerciseId, setIndex, weight, reps } = req.body;
  const numericWeight = Number(weight);
  const numericReps = Number(reps);
  if (!dayId || !exerciseId || !Number.isInteger(setIndex) || setIndex < 0 || !Number.isFinite(numericWeight) || numericWeight < 0 || !Number.isInteger(numericReps) || numericReps < 0) {
    return res.status(400).json({ error: 'A valid day, exercise, set, weight and reps are required.' });
  }
  const updateSet = (days) => normaliseDays(days).map(day => day.id !== dayId ? day : ({
    ...day,
    exercises: day.exercises.map(exercise => {
      if (exercise.exercise_id !== exerciseId) return exercise;
      const setValues = [...(exercise.set_values || [])];
      setValues[setIndex] = { weight: numericWeight, reps: numericReps };
      return { ...exercise, set_values: setValues };
    })
  }));
  try {
    if (global.useMockDatabase) {
      const plan = Object.values(mockDb.workout_plans).find(item => item.share_id === req.params.shareId);
      if (!plan) return res.status(404).json({ error: 'Scheda condivisa non trovata.' });
      plan.days = updateSet(plan.days || normaliseDays(null, plan.exercises || []));
      return res.status(200).json({ message: 'Serie salvata.' });
    }
    if (!supabaseAdmin) return res.status(503).json({ error: 'Condivisione non configurata sul server.' });
    const { data: plan, error: readError } = await supabaseAdmin.from('workout_plans').select('id, days').eq('share_id', req.params.shareId).maybeSingle();
    if (readError || !plan) return res.status(404).json({ error: 'Scheda condivisa non trovata.' });
    const { error: updateError } = await supabaseAdmin.from('workout_plans').update({ days: updateSet(plan.days) }).eq('id', plan.id);
    if (updateError) return res.status(400).json({ error: updateError.message });
    return res.status(200).json({ message: 'Serie salvata.' });
  } catch (err) {
    console.error('Save shared workout weight error:', err);
    return res.status(500).json({ error: 'Impossibile salvare il peso.' });
  }
});

// 1. GET ALL WORKOUT PLANS (routines) FOR CURRENT USER
router.get('/', requireAuth, async (req, res) => {
  if (global.useMockDatabase) {
    const userPlans = Object.values(mockDb.workout_plans)
      .filter(p => p.profile_id === req.user.id)
      .map(({ exercises, ...plan }) => plan); // return without details
    return res.status(200).json({ workoutPlans: userPlans });
  }

  try {
    const userClient = getSupabaseClientForUser(req.headers.authorization);
    const { data, error } = await userClient
      .from('workout_plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ workoutPlans: data });
  } catch (err) {
    console.error('Get workout plans error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Enable sharing and return a stable, unguessable public identifier.
router.post('/:id/share', requireAuth, async (req, res) => {
  const { id } = req.params;
  if (global.useMockDatabase) {
    const plan = mockDb.workout_plans[id];
    if (!plan || plan.profile_id !== req.user.id) return res.status(404).json({ error: 'Workout plan not found.' });
    plan.share_id = plan.share_id || createShareId();
    return res.status(200).json({ shareId: plan.share_id });
  }
  try {
    const userClient = getSupabaseClientForUser(req.headers.authorization);
    const { data: existing, error: fetchError } = await userClient.from('workout_plans').select('share_id').eq('id', id).single();
    if (fetchError || !existing) return res.status(404).json({ error: 'Workout plan not found.' });
    if (existing.share_id) return res.status(200).json({ shareId: existing.share_id });
    const { data, error } = await userClient.from('workout_plans').update({ share_id: createShareId() }).eq('id', id).select('share_id').single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ shareId: data.share_id });
  } catch (err) {
    console.error('Create share link error:', err);
    return res.status(500).json({ error: 'Impossibile creare il link condivisibile.' });
  }
});

// 2. GET SINGLE WORKOUT PLAN WITH EXERCISES
router.get('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  if (global.useMockDatabase) {
    const plan = mockDb.workout_plans[id];
    if (!plan || plan.profile_id !== req.user.id) {
      return res.status(404).json({ error: 'Workout plan not found.' });
    }
    
    const days = formatMockDays(plan.days || normaliseDays(null, plan.exercises || []));
    const activeDay = days.find(day => day.id === req.query.dayId) || days[0];

    return res.status(200).json({
      ...plan,
      days,
      activeDay,
      exercises: activeDay?.exercises || []
    });
  }

  try {
    const userClient = getSupabaseClientForUser(req.headers.authorization);
    
    // Get plan details
    const { data: plan, error: planError } = await userClient
      .from('workout_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ error: 'Workout plan not found.' });
    }

    // New multi-day plans keep each day's exercise configuration in the plan.
    if (Array.isArray(plan.days) && plan.days.length > 0) {
      const days = normaliseDays(plan.days);
      const exerciseIds = days.flatMap(day => day.exercises.map(exercise => exercise.exercise_id));
      const { data: library } = await userClient.from('exercises').select('id, name, description, category_id').in('id', exerciseIds);
      const byId = new Map((library || []).map(exercise => [exercise.id, exercise]));
      const formattedDays = days.map(day => ({ ...day, exercises: day.exercises.map((item, index) => ({ id: `plan-ex-${day.id}-${index}`, ...item, name: byId.get(item.exercise_id)?.name || 'Unknown Exercise', description: byId.get(item.exercise_id)?.description || '', category_id: byId.get(item.exercise_id)?.category_id || '' })) }));
      const activeDay = formattedDays.find(day => day.id === req.query.dayId) || formattedDays[0];
      return res.status(200).json({ ...plan, days: formattedDays, activeDay, exercises: activeDay.exercises });
    }

    // Get exercises for this plan
    const { data: exercises, error: exercisesError } = await userClient
      .from('workout_plan_exercises')
      .select(`
        id,
        sets,
        reps,
        restTime,
        orderIndex,
        exercise:exercises (
          id,
          name,
          description,
          category_id
        )
      `)
      .eq('workout_plan_id', id)
      .order('orderIndex');

    if (exercisesError) {
      return res.status(400).json({ error: exercisesError.message });
    }

    // Format structure nicely
    const formattedExercises = exercises.map(item => ({
      id: item.id,
      sets: item.sets,
      reps: item.reps,
      restTime: item.restTime,
      orderIndex: item.orderIndex,
      exercise_id: item.exercise?.id,
      name: item.exercise?.name,
      description: item.exercise?.description,
      category_id: item.exercise?.category_id
    }));

    return res.status(200).json({
      ...plan,
      exercises: formattedExercises
    });
  } catch (err) {
    console.error('Get workout plan details error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. CREATE NEW WORKOUT PLAN WITH EXERCISES
router.post('/', requireAuth, async (req, res) => {
  const { name, description, exercises, days: requestedDays } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Workout plan name is required.' });
  }

  if (global.useMockDatabase) {
    const planId = 'pln-' + Math.random().toString(36).substr(2, 9);
    
    const days = normaliseDays(requestedDays, exercises);

    const newPlan = {
      id: planId,
      profile_id: req.user.id,
      name,
      description: description || '',
      created_at: new Date().toISOString(),
      days
    };

    mockDb.workout_plans[planId] = newPlan;
    return res.status(201).json({ message: 'Workout routine created (MOCK MODE)', id: planId });
  }

  try {
    const userClient = getSupabaseClientForUser(req.headers.authorization);

    // 1. Insert plan
    const { data: plan, error: planError } = await userClient
      .from('workout_plans')
      .insert({
        profile_id: req.user.id,
        name,
        description: description || '',
        days: normaliseDays(requestedDays, exercises)
      })
      .select()
      .single();

    if (planError) {
      return res.status(400).json({ error: planError.message });
    }

    // 2. Insert exercises if provided
    if (exercises && Array.isArray(exercises) && exercises.length > 0) {
      const exercisesToInsert = exercises.map((ex, index) => ({
        workout_plan_id: plan.id,
        exercise_id: ex.exercise_id,
        sets: ex.sets || 3,
        reps: ex.reps !== undefined ? String(ex.reps) : '10',
        restTime: ex.restTime !== undefined ? parseInt(ex.restTime) : 60,
        orderIndex: ex.orderIndex !== undefined ? ex.orderIndex : index
      }));

      const { error: insertError } = await userClient
        .from('workout_plan_exercises')
        .insert(exercisesToInsert);

      if (insertError) {
        // Rollback plan manually
        await userClient.from('workout_plans').delete().eq('id', plan.id);
        return res.status(400).json({ error: 'Error adding exercises to routine: ' + insertError.message });
      }
    }

    return res.status(201).json({ message: 'Workout routine created successfully', id: plan.id });
  } catch (err) {
    console.error('Create workout plan error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. UPDATE WORKOUT PLAN WITH EXERCISES
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { name, description, exercises, days: requestedDays } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Workout plan name is required.' });
  }

  if (global.useMockDatabase) {
    const plan = mockDb.workout_plans[id];
    if (!plan || plan.profile_id !== req.user.id) {
      return res.status(404).json({ error: 'Workout plan not found.' });
    }

    plan.name = name;
    plan.description = description || '';
    plan.days = normaliseDays(requestedDays, exercises);

    return res.status(200).json({ message: 'Workout routine updated (MOCK MODE)' });
  }

  try {
    const userClient = getSupabaseClientForUser(req.headers.authorization);

    // 1. Update plan
    const { error: planError } = await userClient
      .from('workout_plans')
      .update({
        name,
        description: description || '',
        days: normaliseDays(requestedDays, exercises)
      })
      .eq('id', id)
      .eq('profile_id', req.user.id);

    if (planError) {
      return res.status(400).json({ error: planError.message });
    }

    // 2. Delete old exercises
    const { error: deleteError } = await userClient
      .from('workout_plan_exercises')
      .delete()
      .eq('workout_plan_id', id);

    if (deleteError) {
      return res.status(400).json({ error: 'Error re-configuring exercises: ' + deleteError.message });
    }

    // 3. Insert new exercises
    if (exercises && Array.isArray(exercises) && exercises.length > 0) {
      const exercisesToInsert = exercises.map((ex, index) => ({
        workout_plan_id: id,
        exercise_id: ex.exercise_id,
        sets: ex.sets || 3,
        reps: ex.reps !== undefined ? String(ex.reps) : '10',
        restTime: ex.restTime !== undefined ? parseInt(ex.restTime) : 60,
        orderIndex: ex.orderIndex !== undefined ? ex.orderIndex : index
      }));

      const { error: insertError } = await userClient
        .from('workout_plan_exercises')
        .insert(exercisesToInsert);

      if (insertError) {
        return res.status(400).json({ error: 'Error inserting updated exercises: ' + insertError.message });
      }
    }

    return res.status(200).json({ message: 'Workout routine updated successfully' });
  } catch (err) {
    console.error('Update workout plan error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 5. DELETE WORKOUT PLAN
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  if (global.useMockDatabase) {
    const plan = mockDb.workout_plans[id];
    if (!plan || plan.profile_id !== req.user.id) {
      return res.status(404).json({ error: 'Workout plan not found.' });
    }
    delete mockDb.workout_plans[id];
    return res.status(200).json({ message: 'Workout routine deleted (MOCK MODE)' });
  }

  try {
    const userClient = getSupabaseClientForUser(req.headers.authorization);
    const { error } = await userClient
      .from('workout_plans')
      .delete()
      .eq('id', id)
      .eq('profile_id', req.user.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Workout routine deleted successfully' });
  } catch (err) {
    console.error('Delete workout plan error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
