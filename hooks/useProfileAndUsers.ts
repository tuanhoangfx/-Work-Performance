import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '../types';

export const useProfileAndUsers = (session: Session | null) => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [allUsers, setAllUsers] = useState<Profile[]>([]);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [isAdminView, setIsAdminView] = useState(false);

    const getAllUsers = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('profiles').select('*').order('full_name');
            if (error) throw error;
            setAllUsers(data || []);
        } catch (error: any) {
            console.error('Error fetching users:', error.message);
        }
    }, []);

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
            getProfile(session.user);
            getAllUsers();
        } else {
            setProfile(null);
            setAllUsers([]);
            setLoadingProfile(false);
            setIsAdminView(false);
        }
    }, [session, getProfile, getAllUsers]);

    return { profile, allUsers, loadingProfile, isAdminView, setIsAdminView, getProfile };
};
