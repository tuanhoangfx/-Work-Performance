import { createClient } from '@supabase/supabase-js';

// IMPORTANT: These credentials connect to the new Supabase project.
const supabaseUrl: string = 'https://zvdxznbbwbqvdaxliujs.supabase.co';
const supabaseAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZHh6bmJid2JxdmRheGxpdWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNjExNTcsImV4cCI6MjA3NzkzNzE1N30.mmak6-vPKzqaV2ww2Ad39RVLA8y6FOPsP_TP6tBhClo';

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase is not configured. Please add your SUPABASE_URL and SUPABASE_ANON_KEY to lib/supabase.ts to enable authentication."
  );
}

// Initialize the Supabase client.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);