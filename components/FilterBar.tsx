import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { Profile } from '../types';

export interface Filters {
  searchTerm: string;
  creatorId: string;
  priority: 'all' | 'low' | 'medium' | 'high';
}

interface FilterBarProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  allUsers: Profile[];
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, allUsers }) => {
  const { t } = useSettings();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  const priorityOptions: { value: Filters['priority'], label: string }[] = [
    { value: 'all', label: t.allPriorities },
    { value: 'low', label: t.low },
    { value: 'medium', label: t.medium },
    { value: 'high', label: t.high },
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
        <label htmlFor="creatorId" className="sr-only">{t.filterByCreator}</label>
        <select
          id="creatorId"
          name="creatorId"
          value={filters.creatorId}
          onChange={handleInputChange}
          className="w-full sm:w-auto px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
        >
          <option value="all">{t.allCreators}</option>
          {allUsers.map(user => (
            <option key={user.id} value={user.id}>{user.full_name}</option>
          ))}
        </select>
      </div>
      <div className="flex-shrink-0">
        <label htmlFor="priority" className="sr-only">{t.filterByPriority}</label>
        <select
          id="priority"
          name="priority"
          value={filters.priority}
          onChange={handleInputChange}
          className="w-full sm:w-auto px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
        >
          {priorityOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default FilterBar;