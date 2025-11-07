import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { Profile } from '../../types';
import { ChevronDownIcon } from '../Icons';
import Avatar from './Avatar';

const AssigneeSelect = ({ value, options, onChange, hasError }: { value: string; options: Profile[]; onChange: (value: string) => void; hasError: boolean; }) => {
    const { t } = useSettings();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.id === value);
    
    return (
        <div className="relative mt-1" ref={ref}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className={`w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-700 border rounded-md shadow-sm text-left ${hasError ? 'border-red-500 ring-2 ring-red-500/50 animate-shake' : 'border-gray-300 dark:border-gray-600'}`}>
                <div className="flex items-center gap-2">
                    {selectedOption && <Avatar user={selectedOption} title={selectedOption.full_name || ''} size={20} />}
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{selectedOption?.full_name || t.selectEmployee}</span>
                </div>
                <ChevronDownIcon size={16} className="text-gray-400" />
            </button>
            {isOpen && (
                <div className="absolute z-20 top-full mt-1 w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-md shadow-lg border dark:border-gray-600 animate-fadeIn max-h-48 overflow-y-auto">
                    {options.map((option) => (
                        <button key={option.id} type="button" onClick={() => { onChange(option.id); setIsOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-[var(--accent-color)]/10 dark:hover:bg-[var(--accent-color)]/20">
                             <Avatar user={option} title={option.full_name || ''} size={20} />
                            <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{option.full_name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AssigneeSelect;
