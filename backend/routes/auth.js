import express from 'express';
import { supabase, getSupabaseClientForUser } from '../supabaseClient.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { mockDb } from '../mockDb.js';

const router = express.Router();

// 1. REGISTER
router.post('/register', async (req, res) => {
  const { email, password, username, fullName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  // MOCK MODE
  if (global.useMockDatabase) {
    const existing = mockDb.users.find(u => u.email === email);
    if (existing) {
      return res.status(400).json({ error: 'User already exists.' });
    }

    const newUser = {
      id: 'usr-' + Math.random().toString(36).substr(2, 9),
      email,
      password, // In a real app we'd hash this, but for local mock it's fine
      username: username || email.split('@')[0],
      fullName: fullName || ''
    };

    mockDb.users.push(newUser);
    mockDb.profiles[newUser.id] = {
      id: newUser.id,
      username: newUser.username,
      full_name: newUser.fullName,
      avatar_url: '',
      updated_at: new Date().toISOString()
    };

    const mockToken = `mock-token-${newUser.id}`;

    return res.status(201).json({
      message: 'Registration successful (MOCK MODE)',
      user: { id: newUser.id, email: newUser.email },
      session: { access_token: mockToken, expires_in: 3600 }
    });
  }

  // SUPABASE MODE
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0],
          full_name: fullName || ''
        }
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({
      message: 'Registration successful! Check your email for verification if enabled.',
      user: data.user,
      session: data.session
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  // MOCK MODE
  if (global.useMockDatabase) {
    const user = mockDb.users.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const mockToken = `mock-token-${user.id}`;

    return res.status(200).json({
      message: 'Login successful (MOCK MODE)',
      user: { id: user.id, email: user.email },
      session: { access_token: mockToken, expires_in: 3600 }
    });
  }

  // SUPABASE MODE
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      message: 'Login successful',
      user: data.user,
      session: data.session
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. GET CURRENT PROFILE
router.get('/me', requireAuth, async (req, res) => {
  // MOCK MODE
  if (global.useMockDatabase) {
    const profile = mockDb.profiles[req.user.id];
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }
    return res.status(200).json({ profile });
  }

  // SUPABASE MODE
  try {
    const userClient = getSupabaseClientForUser(req.headers.authorization);
    const { data, error } = await userClient
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ profile: data });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. UPDATE CURRENT PROFILE
router.put('/me', requireAuth, async (req, res) => {
  const { username, fullName, avatarUrl } = req.body;

  // MOCK MODE
  if (global.useMockDatabase) {
    const profile = mockDb.profiles[req.user.id];
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    profile.username = username || profile.username;
    profile.full_name = fullName || profile.full_name;
    profile.avatar_url = avatarUrl || profile.avatar_url;
    profile.updated_at = new Date().toISOString();

    return res.status(200).json({ message: 'Profile updated (MOCK MODE)', profile });
  }

  // SUPABASE MODE
  try {
    const userClient = getSupabaseClientForUser(req.headers.authorization);
    const { data, error } = await userClient
      .from('profiles')
      .update({
        username,
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Profile updated successfully', profile: data });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
