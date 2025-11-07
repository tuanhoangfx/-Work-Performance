import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Profile } from '../types';
import { ChevronDownIcon, UsersIcon, CalendarIcon } from './Icons';
import Avatar from './common/Avatar';

export interface Filters {
  searchTerm: string;
  creatorId: string;
  priority: 'all' | 'low' | 'medium' | 'high';
  dueDate: 'all' | 'overdue' | 'today' | 'this_week';
}

interface FilterBarProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  allUsers: Profile[];
}

interface FilterOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

const FilterSelect: React.FC<{
  defaultIcon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  widthClass?: string;
}> = ({ defaultIcon, value, onChange, options, widthClass = 'sm:w-48' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className={`relative ${widthClass} w-full`} ref={ref}>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-left text-sm">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-gray-500 flex-shrink-0">{selectedOption?.icon || defaultIcon}</span>
          <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{selectedOption.label}</span>
        </div>
        <ChevronDownIcon size={16} className="text-gray-400 flex-shrink-0" />
      </button>
      {isOpen && (
        <div className="absolute z-20 top-full mt-1 w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-md shadow-lg border dark:border-gray-600 animate-fadeIn max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => { onChange(option.value); setIsOpen(false); }}
              className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-[var(--accent-color)]/10 dark:hover:bg-[var(--accent-color)]/20"
            >
              <span className="flex-shrink-0 w-5 flex items-center justify-center">{option.icon || defaultIcon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};


const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, allUsers }) => {
  const { t } = useSettings();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  const priorityOptions: FilterOption[] = [
    { value: 'all', label: t.allPriorities },
    { value: 'low', label: t.low, icon: <span className="text-base">💤</span> },
    { value: 'medium', label: t.medium, icon: <span className="text-base">⚡</span> },
    { value: 'high', label: t.high, icon: <span className="text-base">🚨</span> },
  ];
  
  const creatorOptions: FilterOption[] = [
      { value: 'all', label: t.allCreators },
      ...allUsers.map(user => ({ value: user.id, label: user.full_name || '', icon: <Avatar user={user} title={user.full_name || ''} size={20} /> }))
  ];
  
  const dueDateOptions: FilterOption[] = [
    { value: 'all', label: t.allDates },
    { value: 'overdue', label: t.overdue, icon: <span className="text-base">⏰</span> },
    { value: 'today', label: t.dueToday, icon: <span className="text-base">🗓️</span> },
    { value: 'this_week', label: t.dueThisWeek, icon: <span className="text-base">📅</span> },
  ];

  return (
    <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg flex flex-wrap items-center gap-4">
      <div className="flex-grow min-w-[200px]">
        <input
          type="text"
          name="searchTerm"
          placeholder={t.searchPlaceholder}
          value={filters.searchTerm}
          onChange={handleInputChange}
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
        />
      </div>
       <div className="flex-shrink-0">
        <FilterSelect
            defaultIcon={<CalendarIcon size={16}/>}
            value={filters.dueDate}
            onChange={(value) => onFilterChange({ ...filters, dueDate: value as Filters['dueDate'] })}
            options={dueDateOptions}
        />
      </div>
      <div className="flex-shrink-0">
        <FilterSelect
            defaultIcon={<UsersIcon size={16}/>}
            value={filters.creatorId}
            onChange={(value) => onFilterChange({ ...filters, creatorId: value })}
            options={creatorOptions}
        />
      </div>
      <div className="flex-shrink-0">
         <FilterSelect
            defaultIcon={<span className="text-gray-500">★</span>}
            value={filters.priority}
            onChange={(value) => onFilterChange({ ...filters, priority: value as Filters['priority'] })}
            options={priorityOptions}
        />
      </div>
    </div>
  );
};

export default FilterBar;
