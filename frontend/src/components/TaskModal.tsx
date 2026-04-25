import { useState } from 'react';
import { Task, TaskCreate, updateTask, deleteTask } from '../api';
import { TaskForm } from './TaskForm';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onTaskChange: () => void;
}

export const TaskModal = ({ task, onClose, onTaskChange }: TaskModalProps) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: TaskCreate) => {
    setIsLoading(true);
    setError(null);
    try {
      await updateTask(task.id, formData);
      onTaskChange();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка обновления');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Удалить задачу?')) return;
    setIsLoading(true);
    try {
      await deleteTask(task.id);
      onTaskChange();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold">
            {mode === 'view' ? 'Просмотр задачи' : 'Редактирование задачи'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {mode === 'view' ? (
          <div className="space-y-3">
            <TaskDetail label="Название" value={task.name} />
            <TaskDetail label="Описание" value={task.description || '-'} />
            <TaskDetail 
              label="Статус" 
              value={
                task.status === 'done' ? 'Выполнено' : 
                task.status === 'in_progress' ? 'В работе' : 'К выполнению'
              } 
            />
            <TaskDetail 
              label="Приоритет" 
              value={
                task.priority === 'high' ? 'Высокий' : 
                task.priority === 'medium' ? 'Средний' : 'Низкий'
              } 
            />
            <TaskDetail label="Дата" value={task.date} />
            {task.tags && <TaskDetail label="Теги" value={task.tags} />}
            <button
              onClick={() => setMode('edit')}
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Редактировать
            </button>
          </div>
        ) : (
          <TaskForm
            task={task}
            onSubmit={handleSubmit}
            onCancel={() => setMode('view')}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};

const TaskDetail = ({ label, value }: { label: string; value: string }) => (
  <div>
    <span className="font-medium">{label}:</span> {value}
  </div>
);