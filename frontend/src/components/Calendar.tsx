import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { Task } from '../api';

interface CalendarProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const Calendar = ({ tasks, onTaskClick }: CalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const tasksByDate = useMemo(() => {
    return tasks.reduce((acc, task) => {
      const dateKey = task.date;
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
  }, [tasks]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  const getTaskStatusClasses = (status: Task['status']) => {
    const classes: Record<Task['status'], string> = {
      todo: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      done: 'bg-green-100 text-green-800',
    };
    return classes[status];
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          aria-label="Предыдущий месяц"
        >
          ←
        </button>
        <h3 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          aria-label="Следующий месяц"
        >
          →
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
        
        {Array(monthStart.getDay() - 1).fill(null).map((_, i) => (
          <div key={`empty-${i}`} className="p-2" />
        ))}
        
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDate[dateKey] || [];
          const isToday = isSameDay(day, new Date());
          
          return (
            <div
              key={dateKey}
              className={`p-2 min-h-[80px] border rounded ${
                isToday ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
              }`}
            >
              <div className={`text-sm ${isToday ? 'font-bold text-blue-600' : 'text-gray-700'}`}>
                {format(day, 'd')}
              </div>
              {dayTasks.slice(0, 2).map((task) => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className={`text-xs truncate p-1 mt-1 rounded cursor-pointer ${getTaskStatusClasses(task.status)}`}
                >
                  {task.name}
                </div>
              ))}
              {dayTasks.length > 2 && (
                <div className="text-xs text-gray-500 mt-1">+{dayTasks.length - 2}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};