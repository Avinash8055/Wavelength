import { createClient } from '@supabase/supabase-js';
import { createTestUser } from './auth';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Initialize auth state
export const initializeAuth = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('No session found, creating test user...');
      try {
        await createTestUser();
        console.log('Test user created and signed in');
      } catch (error) {
        console.error('Error with test user:', error);
        throw error;
      }
    } else {
      console.log('Existing session found');
    }
  } catch (error) {
    console.error('Error initializing auth:', error);
    throw error;
  }
};

// Initialize auth immediately
initializeAuth().catch(error => {
  console.error('Failed to initialize auth:', error);
});