import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Task } from '../types';
import { useSettings } from '../context/SettingsContext';
import { ClipboardListIcon, SpinnerIcon, CheckCircleIcon, XCircleIcon, ClockIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface PerformanceSummaryProps {
  allTasks: Task[];
}

type TimeRange = 'today' | 'thisWeek' | 'thisMonth' | 'last7' | 'last30' | 'customMonth' | 'customRange';

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; }> = ({ icon, label, value }) => (
    <div className="bg-white dark:bg-gray-800/80 rounded-lg shadow p-3 flex items-center gap-3">
        <div className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-full">{icon}</div>
        <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
        </div>
    </div>
);

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
                className="flex items-center justify-between gap-2 w-44 px-3 py-2 bg-white dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] text-sm"
            >
                <span className="font-medium text-gray-800 dark:text-gray-200">{formattedValue}</span>
                <CalendarIcon size={16} className="text-gray-500" />
            </button>
            {isOpen && (
                <div className="absolute z-10 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 p-3 animate-fadeIn">
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
                                className={`p-2 text-sm rounded-md transition-colors ${currentYear === new Date(value + '-01').getFullYear() && selectedMonth === index ? 'bg-[var(--accent-color)] text-white font-bold' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
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


const PerformanceSummary: React.FC<PerformanceSummaryProps> = ({ allTasks }) => {
  const { t } = useSettings();
  const [timeRange, setTimeRange] = useState<TimeRange>('thisMonth');
  const [customMonth, setCustomMonth] = useState(new Date().toISOString().slice(0, 7));
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);


  const filteredTasks = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    switch (timeRange) {
        case 'today':
            startDate = todayStart;
            endDate = todayEnd;
            break;
        case 'thisWeek':
            const firstDayOfWeek = new Date(todayStart);
            firstDayOfWeek.setDate(todayStart.getDate() - todayStart.getDay());
            startDate = firstDayOfWeek;
            endDate = todayEnd;
            break;
        case 'thisMonth':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = todayEnd;
            break;
        case 'last7':
            startDate = new Date();
            startDate.setDate(todayStart.getDate() - 6);
            startDate.setHours(0,0,0,0);
            endDate = todayEnd;
            break;
        case 'last30':
            startDate = new Date();
            startDate.setDate(todayStart.getDate() - 29);
            startDate.setHours(0,0,0,0);
            endDate = todayEnd;
            break;
        case 'customMonth':
            if (!customMonth) return allTasks;
            const [year, month] = customMonth.split('-').map(Number);
            startDate = new Date(year, month - 1, 1);
            endDate = new Date(year, month, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'customRange':
            if (!customStartDate) return allTasks;
            startDate = new Date(customStartDate);
            startDate.setHours(0, 0, 0, 0);
            endDate = customEndDate ? new Date(customEndDate) : new Date(customStartDate);
            endDate.setHours(23, 59, 59, 999);
            break;
        default:
            return allTasks;
    }

    return allTasks.filter(task => {
        const taskDate = new Date(task.created_at);
        return taskDate >= startDate && taskDate <= endDate;
    });

  }, [allTasks, timeRange, customMonth, customStartDate, customEndDate]);

  const stats = useMemo(() => {
    return {
      total: filteredTasks.length,
      todo: filteredTasks.filter(t => t.status === 'todo').length,
      inprogress: filteredTasks.filter(t => t.status === 'inprogress').length,
      done: filteredTasks.filter(t => t.status === 'done').length,
      cancelled: filteredTasks.filter(t => t.status === 'cancelled').length,
    };
  }, [filteredTasks]);

  const avgCompletionTime = useMemo(() => {
      const doneTasks = filteredTasks.filter(t => t.status === 'done');
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

  }, [filteredTasks]);
  
  return (
      <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-xl font-bold">{t.performanceSummary}</h3>
            <div className="flex flex-wrap items-center gap-2">
                <select
                    value={timeRange}
                    onChange={e => setTimeRange(e.target.value as TimeRange)}
                    className="block w-auto px-3 py-2 bg-white dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] text-sm"
                >
                    <option value="today">{t.today}</option>
                    <option value="thisWeek">{t.thisWeek}</option>
                    <option value="thisMonth">{t.thisMonth}</option>
                    <option value="last7">{t.last7Days}</option>
                    <option value="last30">{t.last30Days}</option>
                    <option value="customMonth">{t.customMonth}</option>
                    <option value="customRange">{t.customRange}</option>
                </select>

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