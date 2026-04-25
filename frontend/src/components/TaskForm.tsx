import { useState, useEffect } from 'react';
import { Task, TaskCreate } from '../api';
import { DEFAULT_FORM_DATA } from '../utils/taskUtils';

interface TaskFormProps {
  task?: Task | null;
  onSubmit: (data: TaskCreate) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export const TaskForm = ({ task, onSubmit, onCancel, isLoading }: TaskFormProps) => {
  const [formData, setFormData] = useState<TaskCreate>(DEFAULT_FORM_DATA);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name,
        description: task.description,
        status: task.status,
        priority: task.priority,
        tags: task.tags || '',
        date: task.date,
      });
    } else {
      setFormData(DEFAULT_FORM_DATA);
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      setValidationError('Введите название задачи');
      return;
    }
    
    setValidationError(null);
    await onSubmit(formData);
  };

  const handleChange = (field: keyof TaskCreate, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'name' && validationError) {
      setValidationError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {validationError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {validationError}
        </div>
      )}
      
      <div>
        <label className="block text-sm text-gray-600 mb-1">Название *</label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Введите наз��ание задачи"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm text-gray-600 mb-1">Описание</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="Опишите задачу подробнее"
        />
      </div>
      
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[120px]">
          <label className="block text-sm text-gray-600 mb-1">Статус</label>
          <select
            value={formData.status || 'todo'}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="todo">К выполнению</option>
            <option value="in_progress">В работе</option>
            <option value="done">Выполнено</option>
          </select>
        </div>
        
        <div className="flex-1 min-w-[120px]">
          <label className="block text-sm text-gray-600 mb-1">Приоритет</label>
          <select
            value={formData.priority || 'medium'}
            onChange={(e) => handleChange('priority', e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
        </div>
        
        <div className="flex-1 min-w-[120px]">
          <label className="block text-sm text-gray-600 mb-1">Дата</label>
          <input
            type="date"
            value={formData.date || ''}
            onChange={(e) => handleChange('date', e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        
        <div className="flex-1 min-w-[120px]">
          <label className="block text-sm text-gray-600 mb-1">Теги</label>
          <input
            type="text"
            value={formData.tags || ''}
            onChange={(e) => handleChange('tags', e.target.value)}
            placeholder="тег1, тег2"
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>
      
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Сохранение...' : 'Сохранить'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          Отмена
        </button>
      </div>
    </form>
  );
};