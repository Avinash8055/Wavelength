import { supabase } from './supabase';

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Create a test user for development
export async function createTestUser() {
  try {
    const testEmail = 'test@example.com';
    const testPassword = 'Test123!@#';

    // First try to sign in
    try {
      const { data: signInData } = await signIn(testEmail, testPassword);
      return signInData;
    } catch (signInError) {
      // If sign in fails, create a new user
      try {
        const { data: signUpData } = await signUp(testEmail, testPassword);
        if (signUpData.user) {
          // After signup, sign in immediately
          const { data: signInData } = await signIn(testEmail, testPassword);
          return signInData;
        }
        return signUpData;
      } catch (signUpError) {
        console.error('Error creating test user:', signUpError);
        throw signUpError;
      }
    }
  } catch (error) {
    console.error('Error in createTestUser:', error);
    throw error;
  }
}