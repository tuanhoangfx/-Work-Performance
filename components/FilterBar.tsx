import React, { useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Profile } from '../types';
import { UsersIcon, CalendarIcon } from './Icons';
import MultiSelectDropdown, { MultiSelectOption } from './dashboard/admin/MultiSelectEmployeeDropdown';
import TimeRangeSelect from './performance-summary/TimeRangeSelect';
import MonthPicker from './performance-summary/MonthPicker';
import type { TimeRange } from './PerformanceSummary';

export interface Filters {
  searchTerm: string;
  creatorIds: string[];
  priorities: ('low' | 'medium' | 'high')[];
  dueDates: ('overdue' | 'today' | 'this_week')[];
}

interface FilterBarProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  allUsers: Profile[];
  children?: React.ReactNode;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  customMonth: string;
  setCustomMonth: (month: string) => void;
  customStartDate: string;
  setCustomStartDate: (date: string) => void;
  customEndDate: string;
  setCustomEndDate: (date: string) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  allUsers,
  children,
  timeRange,
  setTimeRange,
  customMonth,
  setCustomMonth,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
}) => {
  const { t, language } = useSettings();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  const timeRangeOptions = useMemo(() => [
    { value: 'today' as TimeRange, label: t.today },
    { value: 'thisWeek' as TimeRange, label: t.thisWeek },
    { value: 'thisMonth' as TimeRange, label: t.thisMonth },
    { value: 'last7' as TimeRange, label: t.last7Days },
    { value: 'last30' as TimeRange, label: t.last30Days },
    { value: 'customMonth' as TimeRange, label: t.customMonth },
    { value: 'customRange' as TimeRange, label: t.customRange },
  ], [t]);

  const priorityOptions: MultiSelectOption[] = [
    { id: 'low', label: t.low, icon: <span className="text-base">💤</span> },
    { id: 'medium', label: t.medium, icon: <span className="text-base">⚡</span> },
    { id: 'high', label: t.high, icon: <span className="text-base">🚨</span> },
  ];
  
  const creatorOptions: MultiSelectOption[] = allUsers.map(user => ({ 
      id: user.id, 
      label: user.full_name || '', 
      avatarUrl: user.avatar_url || undefined
  }));
  
  const dueDateOptions: MultiSelectOption[] = [
    { id: 'overdue', label: t.overdue, icon: <span className="text-base">⏰</span> },
    { id: 'today', label: t.dueToday, icon: <span className="text-base">🗓️</span> },
    { id: 'this_week', label: t.dueThisWeek, icon: <span className="text-base">📅</span> },
  ];

  const getCreatorLabel = (selectedCount: number, totalCount: number) => {
    if (selectedCount === 0 || selectedCount === totalCount) return t.allCreators;
    if (selectedCount === 1) {
        const user = allUsers.find(u => u.id === filters.creatorIds[0]);
        return user?.full_name || '1 Creator';
    }
    return `${selectedCount} ${language === 'vi' ? 'người tạo' : 'Creators'}`;
  };
  
  const getPriorityLabel = (selectedCount: number) => {
    if (selectedCount === 0) return t.allPriorities;
    if (selectedCount === 1) {
      const priority = priorityOptions.find(p => p.id === filters.priorities[0]);
      return priority?.label || '1 Priority';
    }
    return `${selectedCount} ${language === 'vi' ? 'ưu tiên' : 'Priorities'}`;
  };

  const getDueDateLabel = (selectedCount: number) => {
    if (selectedCount === 0) return t.allDates;
    if (selectedCount === 1) {
      const dueDate = dueDateOptions.find(d => d.id === filters.dueDates[0]);
      return dueDate?.label || '1 Date';
    }
    return `${selectedCount} ${language === 'vi' ? 'ngày' : 'Dates'}`;
  };

  return (
    <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
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
        <div className="flex-shrink-0 flex items-center gap-2">
          {children}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TimeRangeSelect
          value={timeRange}
          onChange={setTimeRange}
          options={timeRangeOptions}
        />
        <MultiSelectDropdown
            buttonIcon={<CalendarIcon size={16}/>}
            selectedIds={filters.dueDates}
            onChange={(ids) => onFilterChange({ ...filters, dueDates: ids as Filters['dueDates'] })}
            options={dueDateOptions}
            buttonLabel={getDueDateLabel}
            allLabel={t.allDates}
            searchPlaceholder="Search dates..."
            widthClass='w-full'
        />
        <MultiSelectDropdown
            buttonIcon={<UsersIcon size={16}/>}
            selectedIds={filters.creatorIds}
            onChange={(ids) => onFilterChange({ ...filters, creatorIds: ids })}
            options={creatorOptions}
            buttonLabel={getCreatorLabel}
            allLabel={t.allCreators}
            searchPlaceholder={t.searchUsers}
            widthClass='w-full'
        />
        <MultiSelectDropdown
            buttonIcon={<span className="text-gray-500">★</span>}
            selectedIds={filters.priorities}
            onChange={(ids) => onFilterChange({ ...filters, priorities: ids as Filters['priorities'] })}
            options={priorityOptions}
            buttonLabel={getPriorityLabel}
            allLabel={t.allPriorities}
            searchPlaceholder="Search priorities..."
            widthClass='w-full'
        />
      </div>

      {timeRange === 'customMonth' && (
          <div className="animate-fadeIn mt-4">
              <MonthPicker value={customMonth} onChange={setCustomMonth} />
          </div>
      )}

      {timeRange === 'customRange' && (
          <div className="flex items-center gap-2 animate-fadeIn mt-4">
              <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="block w-auto px-3 py-2 bg-white dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] text-sm"
              />
              <span className="text-gray-500 dark:text-gray-400 text-sm">to</span>
              <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="block w-auto px-3 py-2 bg-white dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] text-sm"
              />
          </div>
      )}
    </div>
  );
};

export default FilterBar;