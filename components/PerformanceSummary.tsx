import React, { useMemo } from 'react';
import { Task } from '../types';
import { useSettings } from '../context/SettingsContext';
import { ClipboardListIcon, SpinnerIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from './Icons';
import StatCard from './performance-summary/StatCard';
import MonthPicker from './performance-summary/MonthPicker';
import TimeRangeSelect from './performance-summary/TimeRangeSelect';

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
