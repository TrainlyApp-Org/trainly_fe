// Trainly Backend In-Memory Mock Database
// Used when Supabase is not configured, to guarantee the app works out of the box.

export const mockDb = {
  users: [],
  profiles: {},
  categories: [
    { id: 'cat-1', name: 'Chest', description: 'Pectoral muscles exercises', icon: 'Flame' },
    { id: 'cat-2', name: 'Back', description: 'Dorsal and back muscles exercises', icon: 'Zap' },
    { id: 'cat-3', name: 'Legs', description: 'Quadriceps, hamstrings, and calves exercises', icon: 'Activity' },
    { id: 'cat-4', name: 'Shoulders', description: 'Deltoids and trapezius exercises', icon: 'Award' },
    { id: 'cat-5', name: 'Arms', description: 'Biceps and triceps exercises', icon: 'Dumbbell' },
    { id: 'cat-6', name: 'Core', description: 'Abdominals and lower back exercises', icon: 'Target' }
  ],
  exercises: [
    // Chest
    { id: 'ex-1', name: 'Panca Piana (Bench Press)', category_id: 'cat-1', description: 'Barbell bench press for overall chest development.', is_custom: false },
    { id: 'ex-2', name: 'Spinte Panca Inclinata (Incline Dumbbell Press)', category_id: 'cat-1', description: 'Incline dumbbell bench press targeting the upper chest.', is_custom: false },
    { id: 'ex-3', name: 'Croci ai Cavi (Cable Flyes)', category_id: 'cat-1', description: 'Cable flyes for isolation and inner chest squeeze.', is_custom: false },
    // Back
    { id: 'ex-4', name: 'Trazioni (Pull-ups)', category_id: 'cat-2', description: 'Bodyweight pull-ups for lat width.', is_custom: false },
    { id: 'ex-5', name: 'Lat Machine (Lat Pulldown)', category_id: 'cat-2', description: 'Lat machine pulldown targeting lats and upper back.', is_custom: false },
    { id: 'ex-6', name: 'Rematore Bilanciere (Barbell Row)', category_id: 'cat-2', description: 'Bent over barbell row for back thickness.', is_custom: false },
    // Legs
    { id: 'ex-7', name: 'Squat con Bilanciere (Barbell Squat)', category_id: 'cat-3', description: 'Classic barbell squat for leg power and quad development.', is_custom: false },
    { id: 'ex-8', name: 'Leg Press', category_id: 'cat-3', description: 'Seated leg press machine.', is_custom: false },
    { id: 'ex-9', name: 'Stacco Rumeno (Romanian Deadlift)', category_id: 'cat-3', description: 'Deadlift focusing on hamstrings and glutes.', is_custom: false },
    // Shoulders
    { id: 'ex-10', name: 'Military Press (Overhead Press)', category_id: 'cat-4', description: 'Barbell overhead press for shoulder strength and size.', is_custom: false },
    { id: 'ex-11', name: 'Alzate Laterali (Lateral Raises)', category_id: 'cat-4', description: 'Dumbbell lateral raises for lateral deltoid isolation.', is_custom: false },
    // Arms
    { id: 'ex-12', name: 'Curl con Manubri (Dumbbell Bicep Curl)', category_id: 'cat-5', description: 'Classic bicep curls with dumbbells.', is_custom: false },
    { id: 'ex-13', name: 'Pushdown Tricipiti (Cable Triceps Pushdown)', category_id: 'cat-5', description: 'Cable attachment pushdowns targeting triceps.', is_custom: false },
    // Core
    { id: 'ex-14', name: 'Plank', category_id: 'cat-6', description: 'Core stability plank.', is_custom: false },
    { id: 'ex-15', name: 'Crunch Addominali (Crunches)', category_id: 'cat-6', description: 'Abdominal crunches.', is_custom: false }
  ],
  workout_plans: {},
  workout_logs: {},
  workout_log_details: {}
};

// Helper function to check if Supabase is properly configured
export const checkSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  
  if (!url || !key || url.includes('your-supabase-project') || key.includes('your-supabase-anon-key')) {
    global.useMockDatabase = true;
    console.log('\x1b[33m%s\x1b[0m', '-------------------------------------------------------------');
    console.log('\x1b[33m%s\x1b[0m', '  Trainly runs in [MOCK DATABASE MODE] (Supabase not configured).');
    console.log('\x1b[33m%s\x1b[0m', '  To connect your own database, configure SUPABASE_URL and ');
    console.log('\x1b[33m%s\x1b[0m', '  SUPABASE_ANON_KEY inside /backend/.env.');
    console.log('\x1b[33m%s\x1b[0m', '-------------------------------------------------------------');
    return false;
  }
  global.useMockDatabase = false;
  console.log('\x1b[32m%s\x1b[0m', '-------------------------------------------------------------');
  console.log('\x1b[32m%s\x1b[0m', '  Trainly runs in [SUPABASE DATABASE MODE] successfully!    ');
  console.log('\x1b[32m%s\x1b[0m', '-------------------------------------------------------------');
  return true;
};
