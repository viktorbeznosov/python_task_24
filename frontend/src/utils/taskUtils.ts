import { Task, TaskCreate } from '../api';

export const STATUS_LABELS: Record<Task['status'], string> = {
  todo: 'К выполнению',
  in_progress: 'В работе',
  done: 'Выполнено',
};

export const PRIORITY_LABELS: Record<Task['priority'], string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};

export const getStatusBadgeClasses = (status: Task['status']): string => {
  const classes: Record<Task['status'], string> = {
    todo: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    done: 'bg-green-100 text-green-800',
  };
  return `px-2 py-1 rounded text-xs ${classes[status]}`;
};

export const getPriorityBadgeClasses = (priority: Task['priority']): string => {
  const classes: Record<Task['priority'], string> = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };
  return `px-2 py-1 rounded text-xs ${classes[priority]}`;
};

export const getDefaultFormData = (): TaskCreate => ({
  name: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  tags: null,
  date: new Date().toISOString().split('T')[0],
});

export const FILTERS_DEFAULT = {
  status: '',
  priority: '',
  date_from: '',
  date_to: '',
  sort_by: 'date',
  sort_order: 'desc',
};