import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { XIcon } from './Icons';
import { useSettings } from '../context/SettingsContext';
import type { Profile } from '../types';
import Avatar from './common/Avatar';

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: Profile) => void;
  employee: Profile;
}

const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({ isOpen, onClose, onSave, employee }) => {
    const { t } = useSettings();
    
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [fullName, setFullName] = useState(employee.full_name);
    const [role, setRole] = useState(employee.role);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(employee.avatar_url);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [message, setMessage] = useState({ text: '', type: '' });

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setFullName(employee.full_name);
        setRole(employee.role);
        setAvatarUrl(employee.avatar_url);
        setAvatarFile(null);
        setMessage({text: '', type: ''});
    }, [employee, isOpen]);
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAvatarFile(e.target.files[0]);
            setAvatarUrl(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setUploading(!!avatarFile);
        setMessage({ text: '', type: '' });

        try {
            let newAvatarUrl = avatarUrl;
            
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const filePath = `${employee.id}/${Date.now()}.${fileExt}`;
                
                // Admin might need to overwrite existing files
                const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, avatarFile, {
                    cacheControl: '3600',
                    upsert: true
                });
                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
                newAvatarUrl = urlData.publicUrl;
            }

            const updatedProfile: Profile = {
                ...employee,
                full_name: fullName,
                avatar_url: newAvatarUrl || '',
                role: role,
                updated_at: new Date().toISOString()
            };
            
            onSave(updatedProfile);

        } catch (error: any) {
            console.error("Error updating employee profile:", error.message);
            setMessage({ text: error.message, type: 'error' });
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    const userForAvatar = {
        ...employee,
        full_name: fullName,
        avatar_url: avatarUrl,
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-start md:items-center p-4 pt-16 md:pt-4 animate-fadeIn"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-employee-modal-title"
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-out animate-fadeInUp"
                onClick={e => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit}>
                    <div className="p-6 relative">
                        <button 
                            type="button"
                            onClick={onClose} 
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors z-10"
                            aria-label={t.close}
                        >
                            <XIcon size={24} />
                        </button>
                        <h2 id="edit-employee-modal-title" className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t.editEmployeeProfile}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{employee.id}</p>

                        <div className="mt-6 space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.avatar}</label>
                                <div className="mt-2 flex items-center gap-4">
                                    <Avatar user={userForAvatar} title="Avatar" size={64} />
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 shadow-sm transition-colors">{t.uploadAvatar}</button>
                                    <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/png, image/jpeg" className="hidden"/>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.fullName}</label>
                                <input type="text" id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.role}</label>
                                <select id="role" value={role} onChange={e => setRole(e.target.value as 'admin' | 'employee')} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-sm">
                                    <option value="employee">{t.employee}</option>
                                    <option value="admin">{t.admin}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-3 flex justify-between items-center rounded-b-2xl">
                         {message.text && <span className={`text-sm animate-fadeIn ${message.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{message.text}</span>}
                        <div className="flex-grow flex justify-end space-x-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 shadow-sm transition-colors">{t.cancel}</button>
                            <button type="submit" disabled={loading || uploading} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] rounded-md shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none disabled:opacity-50">
                                {uploading ? t.uploading : (loading ? t.updating : t.save)}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditEmployeeModal;
