import React, { useState, useRef, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { type SortConfig, type SortField } from '../lib/taskUtils';
import { SortIcon, ArrowUpIcon, ArrowDownIcon } from './Icons';
import type { Task } from '../types';

interface SortDropdownProps {
  status: Task['status'];
  config: SortConfig;
  onChange: (config: SortConfig) => void;
}

type SortOption = {
    field: SortField;
    label: string;
};

const SortDropdown: React.FC<SortDropdownProps> = ({ status, config, onChange }) => {
    const { t } = useSettings();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const baseSortOptions: SortOption[] = [
        { field: 'priority', label: t.priority },
        { field: 'created_at', label: t.creationTime },
        { field: 'due_date', label: t.dueDateLabel },
    ];
    
    if (status === 'done' || status === 'cancelled') {
        baseSortOptions.push({ field: 'updated_at', label: t.completionTime });
    }

    const handleSortChange = (field: SortField) => {
        if (config.field === field) {
            onChange({ field, direction: config.direction === 'asc' ? 'desc' : 'asc' });
        } else {
            onChange({ field, direction: 'desc' });
        }
    };
    
    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none transition-colors"
                title="Sort tasks"
            >
                <SortIcon size={14} />
            </button>
            {isOpen && (
                 <div className="absolute right-0 mt-2 w-48 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 z-50 animate-fadeIn p-2">
                     {baseSortOptions.map(option => (
                        <button
                            key={option.field}
                            onClick={() => handleSortChange(option.field)}
                            className="w-full text-left flex justify-between items-center px-3 py-1.5 text-sm rounded-md text-gray-700 dark:text-gray-300 hover:bg-[var(--accent-color)]/10 dark:hover:bg-[var(--accent-color)]/20 transition-colors"
                        >
                            <span className={config.field === option.field ? 'font-bold text-[var(--accent-color)] dark:text-[var(--accent-color-dark)]' : ''}>{option.label}</span>
                             {config.field === option.field && (
                                config.direction === 'asc' 
                                ? <ArrowUpIcon size={16} className="text-[var(--accent-color)]" /> 
                                : <ArrowDownIcon size={16} className="text-[var(--accent-color)]" />
                            )}
                        </button>
                     ))}
                 </div>
            )}
        </div>
    );
};

export default SortDropdown;