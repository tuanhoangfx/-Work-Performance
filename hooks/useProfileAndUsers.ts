import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '../types';
import { AdminView } from '../App';
import { useLocalStorage } from './useLocalStorage';

export const useProfileAndUsers = (session: Session | null) => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [allUsers, setAllUsers] = useLocalStorage<Profile[]>('all_users', []);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [adminView, setAdminView] = useState<AdminView>('myTasks');

    const getAllUsers = useCallback(async () => {
        try {
            // Fetch fresh data in the background
            const { data, error } = await supabase.from('profiles').select('*').order('full_name');
            if (error) throw error;
            // Update state and localStorage with fresh data
            if (data) {
                setAllUsers(data);
            }
        } catch (error: any) {
            console.error('Error fetching users:', error.message);
        }
    }, [setAllUsers]);

    const getProfile = useCallback(async (user: Session['user']) => {
        if (!user) return;
        setLoadingProfile(true);
        try {
            const { data, error } = await supabase.from('profiles').select(`*`).eq('id', user.id).single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                setProfile(data);
            } else {
                const { data: newProfile, error: insertError } = await supabase
                    .from('profiles')
                    .insert({ id: user.id, full_name: user.email })
                    .select().single();

                if (insertError) throw insertError;
                if (newProfile) setProfile(newProfile);
            }
        } catch (error: any) {
            console.error('Error fetching or creating profile:', error.message);
            setProfile(null);
        } finally {
            setLoadingProfile(false);
        }
    }, []);

    useEffect(() => {
        if (session?.user) {
            // Only refetch the profile if it's not loaded yet, or if the user has changed.
            // This prevents the loading flash on tab refocus when the session object gets a new reference.
            if (!profile || profile.id !== session.user.id) {
                getProfile(session.user);
            } else {
                // If profile is already loaded for the current user, ensure loading is false.
                setLoadingProfile(false);
            }
            // We can still refresh the user list in the background.
            getAllUsers();
        } else {
            setProfile(null);
            setAllUsers([]); // Clear users on sign out
            setLoadingProfile(false);
            setAdminView('myTasks');
        }
    }, [session, profile, getProfile, getAllUsers, setAllUsers]);

    return { profile, allUsers, loadingProfile, adminView, setAdminView, getProfile, getAllUsers };
};
