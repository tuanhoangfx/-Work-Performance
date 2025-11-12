import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { Profile } from '../../../types';
import { ChevronDownIcon, UsersIcon, SearchIcon } from '../../Icons';
import Avatar from '../../common/Avatar';

interface MultiSelectEmployeeDropdownProps {
  allUsers: Profile[];
  selectedUserIds: string[];
  onChange: (selectedIds: string[]) => void;
}

const MultiSelectEmployeeDropdown: React.FC<MultiSelectEmployeeDropdownProps> = ({ allUsers, selectedUserIds, onChange }) => {
  const { t, language } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return allUsers;
    return allUsers.filter(user =>
      (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allUsers, searchTerm]);

  const handleToggleUser = (userId: string) => {
    const newSelection = selectedUserIds.includes(userId)
      ? selectedUserIds.filter(id => id !== userId)
      : [...selectedUserIds, userId];
    onChange(newSelection);
  };

  const isAllSelected = allUsers.length > 0 && selectedUserIds.length === allUsers.length;

  const handleToggleAll = () => {
    if (isAllSelected) {
      onChange([]);
    } else {
      onChange(allUsers.map(u => u.id));
    }
  };

  const getButtonLabel = () => {
    if (selectedUserIds.length === 0 || selectedUserIds.length === allUsers.length) {
      return t.allEmployees;
    }
    if (selectedUserIds.length === 1) {
        const user = allUsers.find(u => u.id === selectedUserIds[0]);
        return user?.full_name || `1 ${t.employee}`;
    }
    const pluralEmployee = language === 'vi' ? t.employee : `${t.employee}s`;
    return `${selectedUserIds.length}/${allUsers.length} ${pluralEmployee}`;
  };

  return (
    <div className="relative sm:w-52" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-left text-sm"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <UsersIcon size={16} className="text-gray-500 flex-shrink-0" />
          <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{getButtonLabel()}</span>
        </div>
        <ChevronDownIcon size={16} className={`text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-40 top-full mt-2 w-72 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-lg shadow-xl border dark:border-gray-700 animate-fadeIn flex flex-col max-h-96">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <input
                type="text"
                placeholder={t.searchUsers}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] text-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <SearchIcon size={16} className="text-gray-400" />
              </div>
            </div>
          </div>

          <ul className="overflow-y-auto p-1 flex-grow">
            <li>
              <label className="flex items-center gap-3 px-2 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-[var(--accent-color)]/10 dark:hover:bg-[var(--accent-color)]/20 rounded-md cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleAll}
                  className="h-4 w-4 rounded border-gray-300 text-[var(--accent-color)] focus:ring-[var(--accent-color)]"
                />
                <span className="font-semibold">{t.allEmployees}</span>
              </label>
            </li>
            {filteredUsers.map(user => (
              <li key={user.id}>
                <label className="flex items-center gap-3 px-2 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-[var(--accent-color)]/10 dark:hover:bg-[var(--accent-color)]/20 rounded-md cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => handleToggleUser(user.id)}
                    className="h-4 w-4 rounded border-gray-300 text-[var(--accent-color)] focus:ring-[var(--accent-color)]"
                  />
                  <Avatar user={user} title={user.full_name || ''} size={24} />
                  <span className="truncate flex-grow">{user.full_name}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiSelectEmployeeDropdown;