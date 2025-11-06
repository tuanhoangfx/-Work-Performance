import { createClient } from '@supabase/supabase-js';

// IMPORTANT: These credentials connect to the new Supabase project.
const supabaseUrl: string = 'https://gnxmjfayqmjgtzebzghv.supabase.co';
const supabaseAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdueG1qZmF5cW1qZ3R6ZWJ6Z2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTgzMTgsImV4cCI6MjA3ODAzNDMxOH0.TjNtd9MV0As0WENkIZ_FtpLVvjUB4oHl-jUVDpa4JdA';

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase is not configured. Please add your SUPABASE_URL and SUPABASE_ANON_KEY to lib/supabase.ts to enable authentication."
  );
}

// Initialize the Supabase client.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);