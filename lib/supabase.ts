import { createClient } from '@supabase/supabase-js';

// IMPORTANT: These credentials connect to the new Supabase project.
const supabaseUrl: string = 'https://yhnqwxejjkfgmjmiquhb.supabase.co';
const supabaseAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlobnF3eGVqamtmZ21qbWlxdWhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjMxOTIsImV4cCI6MjA3ODU5OTE5Mn0.U_h3961ZbbF_udT4M2fyJsMpvk8f0bJaOvMo5Mr6O5s';

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase is not configured. Please add your SUPABASE_URL and SUPABASE_ANON_KEY to lib/supabase.ts to enable authentication."
  );
}

// Initialize the Supabase client.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);