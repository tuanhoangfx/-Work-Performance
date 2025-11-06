

import React, { useState, useMemo } from 'react';
import { Task } from '../types';
import { useSettings } from '../context/SettingsContext';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onTaskClick }) => {
  const { language } = useSettings();
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysOfWeek = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(language, { weekday: 'short' });
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2023, 0, i + 1); // A non-leap year starting on Sunday
      return formatter.format(d);
    });
  }, [language]);

  const { monthName, year, days } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthName = new Intl.DateTimeFormat(language, { month: 'long' }).format(currentDate);

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();

    const daysInMonth = [];
    // Add padding for days from the previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
      daysInMonth.push(null);
    }
    // Add days of the current month
    for (let i = 1; i <= totalDays; i++) {
      daysInMonth.push(new Date(year, month, i));
    }
    return { monthName, year, days: daysInMonth };
  }, [currentDate, language]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach(task => {
      if (task.due_date) { // due_date is 'YYYY-MM-DD'
        // Parse date string manually to avoid timezone interpretation issues.
        // new Date('2023-10-26') creates a date at UTC midnight, which can be the previous day in some timezones.
        // This creates the date at local midnight, which is what we want for a calendar view.
        const parts = task.due_date.split('-').map(s => parseInt(s, 10));
        const localDate = new Date(parts[0], parts[1] - 1, parts[2]);
        const dateKey = localDate.toDateString();
        
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)?.push(task);
      }
    });
    return map;
  }, [tasks]);
  
  const isToday = (date: Date) => {
      const today = new Date();
      return date.getDate() === today.getDate() &&
             date.getMonth() === today.getMonth() &&
             date.getFullYear() === today.getFullYear();
  }

  const changeMonth = (delta: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + delta);
      return newDate;
    });
  };
  
  const statusColors: { [key in Task['status']]: string } = {
    todo: 'bg-orange-500 hover:bg-orange-600',
    inprogress: 'bg-indigo-500 hover:bg-indigo-600',
    done: 'bg-green-500 hover:bg-green-600',
    cancelled: 'bg-gray-500 hover:bg-gray-600 line-through',
  };


  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><ChevronLeftIcon /></button>
        <h2 className="text-xl font-bold">{monthName} {year}</h2>
        <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><ChevronRightIcon /></button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {daysOfWeek.map(day => (
          <div key={day} className="text-center font-semibold text-sm text-gray-600 dark:text-gray-400 pb-2">{day}</div>
        ))}

        {days.map((day, index) => (
          <div key={index} className="h-28 md:h-36 border border-gray-200 dark:border-gray-700 rounded-md p-1.5 overflow-hidden flex flex-col">
            {day && (
              <>
                <span className={`text-sm font-medium ${isToday(day) ? 'bg-[var(--accent-color)] text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-gray-800 dark:text-gray-200'}`}>
                  {day.getDate()}
                </span>
                <div className="mt-1 space-y-1 overflow-y-auto">
                    {tasksByDate.get(day.toDateString())?.map(task => (
                        <div 
                            key={task.id} 
                            onClick={() => onTaskClick(task)}
                            className={`p-1 rounded text-white text-xs cursor-pointer transition-colors flex items-center gap-1.5 ${statusColors[task.status]}`}
                            title={task.title}
                        >
                            <span className="truncate">{task.title}</span>
                        </div>
                    ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;