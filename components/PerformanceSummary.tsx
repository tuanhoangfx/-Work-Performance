import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Task } from '../types';
import { useSettings } from '../context/SettingsContext';
import { ClipboardListIcon, SpinnerIcon, CheckCircleIcon, XCircleIcon, ClockIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from './Icons';

export type TimeRange = 'today' | 'thisWeek' | 'thisMonth' | 'last7' | 'last30' | 'customMonth' | 'customRange';

interface PerformanceSummaryProps {
  title: string;
  children?: React.ReactNode;
  tasks: Task[];
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  customMonth: string;
  setCustomMonth: (month: string) => void;
  customStartDate: string;
  setCustomStartDate: (date: string) => void;
  customEndDate: string;
  setCustomEndDate: (date: string) => void;
}


const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; }> = React.memo(({ icon, label, value }) => (
    <div className="bg-white dark:bg-gray-800/80 rounded-lg shadow p-3 flex items-center gap-3">
        <div className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-full">{icon}</div>
        <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
        </div>
    </div>
));

const MonthPicker: React.FC<{ value: string, onChange: (value: string) => void }> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);
    const [currentYear, setDisplayYear] = useState(() => new Date(value + '-01').getFullYear());
    const selectedMonth = new Date(value + '-01').getMonth();

    const { t, language } = useSettings();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);
    
    const months = useMemo(() => Array.from({ length: 12 }, (_, i) => new Date(currentYear, i).toLocaleString(language, { month: 'short' })), [currentYear, language]);
    
    const formattedValue = new Date(value + '-01').toLocaleString(language, { month: 'long', year: 'numeric' });

    return (
        <div className="relative" ref={pickerRef}>
            <button 
                type="button" 
                onClick={() => setIsOpen(!isOpen)}
                className="w-44 flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-left text-sm"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <CalendarIcon size={16} className="text-gray-500 flex-shrink-0" />
                    <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{formattedValue}</span>
                </div>
                <ChevronDownIcon size={16} className="text-gray-400 flex-shrink-0" />
            </button>
            {isOpen && (
                <div className="absolute z-40 top-full mt-2 w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-lg shadow-xl border dark:border-gray-700 p-3 animate-fadeIn">
                    <div className="flex items-center justify-between mb-3">
                        <button type="button" onClick={() => setDisplayYear(y => y - 1)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronLeftIcon size={18}/></button>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{currentYear}</span>
                        <button type="button" onClick={() => setDisplayYear(y => y + 1)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronRightIcon size={18}/></button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {months.map((month, index) => (
                            <button
                                key={month}
                                type="button"
                                onClick={() => {
                                    onChange(`${currentYear}-${(index + 1).toString().padStart(2, '0')}`);
                                    setIsOpen(false);
                                }}
                                className={`p-2 text-sm rounded-md transition-colors text-gray-800 dark:text-gray-200 ${currentYear === new Date(value + '-01').getFullYear() && selectedMonth === index ? 'bg-[var(--accent-color)] text-white font-bold' : 'hover:bg-[var(--accent-color)]/10 dark:hover:bg-[var(--accent-color)]/20'}`}
                            >
                                {month}
                            </button>
                        ))}
                    </div>
                     <div className="flex justify-between items-center mt-3 pt-2 border-t dark:border-gray-700">
                        <button type="button" onClick={() => { onChange(new Date().toISOString().slice(0, 7)); setIsOpen(false); }} className="text-xs font-semibold text-[var(--accent-color)] hover:underline">{t.thisMonth}</button>
                     </div>
                </div>
            )}
        </div>
    );
};

const TimeRangeSelect: React.FC<{ value: TimeRange; onChange: (range: TimeRange) => void; options: { value: TimeRange; label: string }[] }> = ({ value, onChange, options }) => {
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
    <div className="relative w-44" ref={ref}>
        <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-left text-sm">
            <div className="flex items-center gap-2 overflow-hidden">
                <CalendarIcon size={16} className="text-gray-500 flex-shrink-0"/>
                <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{selectedOption.label}</span>
            </div>
            <ChevronDownIcon size={16} className="text-gray-400 flex-shrink-0"/>
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
                        <span>{option.label}</span>
                    </button>
                ))}
            </div>
        )}
    </div>
  );
};


const PerformanceSummary: React.FC<PerformanceSummaryProps> = ({
  title,
  children,
  tasks,
  timeRange,
  setTimeRange,
  customMonth,
  setCustomMonth,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
}) => {
  const { t } = useSettings();
  
  const timeRangeOptions = useMemo(() => [
        { value: 'today' as TimeRange, label: t.today },
        { value: 'thisWeek' as TimeRange, label: t.thisWeek },
        { value: 'thisMonth' as TimeRange, label: t.thisMonth },
        { value: 'last7' as TimeRange, label: t.last7Days },
        { value: 'last30' as TimeRange, label: t.last30Days },
        { value: 'customMonth' as TimeRange, label: t.customMonth },
        { value: 'customRange' as TimeRange, label: t.customRange },
    ], [t]);


  const stats = useMemo(() => {
    return {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inprogress: tasks.filter(t => t.status === 'inprogress').length,
      done: tasks.filter(t => t.status === 'done').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length,
    };
  }, [tasks]);

  const avgCompletionTime = useMemo(() => {
      const doneTasks = tasks.filter(t => t.status === 'done');
      if (doneTasks.length === 0) return 'N/A';
      
      const totalTime = doneTasks.reduce((acc, task) => {
          const created = new Date(task.created_at).getTime();
          const completed = new Date(task.updated_at).getTime();
          return acc + (completed - created);
      }, 0);

      const avgTimeMs = totalTime / doneTasks.length;
      if (avgTimeMs < 0) return 'N/A';
      
      const days = Math.floor(avgTimeMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((avgTimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((avgTimeMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;

  }, [tasks]);
  
  return (
      <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h3 className="text-xl font-bold">{title}</h3>
            <div className="flex flex-wrap items-center gap-2 relative z-10">
                {children}
                <TimeRangeSelect
                    value={timeRange}
                    onChange={setTimeRange}
                    options={timeRangeOptions}
                />

                {timeRange === 'customMonth' && (
                    <div className="animate-fadeIn">
                       <MonthPicker value={customMonth} onChange={setCustomMonth} />
                    </div>
                )}

                {timeRange === 'customRange' && (
                    <div className="flex items-center gap-2 animate-fadeIn">
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
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard icon={<ClipboardListIcon className="text-blue-500" />} label={t.totalTasks} value={stats.total} />
              <StatCard icon={<ClipboardListIcon className="text-orange-500" />} label={t.todo} value={stats.todo} />
              <StatCard icon={<SpinnerIcon className="text-indigo-500 animate-spin"/>} label={t.inprogress} value={stats.inprogress} />
              <StatCard icon={<CheckCircleIcon className="text-green-500" />} label={t.done} value={stats.done} />
              <StatCard icon={<XCircleIcon className="text-gray-500" />} label={t.cancelled} value={stats.cancelled} />
              <StatCard icon={<ClockIcon className="text-purple-500" />} label={t.avgCompletionTime} value={avgCompletionTime} />
          </div>
      </div>
  );
};

export default PerformanceSummary;