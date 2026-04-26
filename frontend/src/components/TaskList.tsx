import { useState } from 'react';
import { Task, TaskCreate, createTask, updateTask, deleteTask } from '../api';
import { FILTERS_DEFAULT } from '../utils/taskUtils';
import { TaskForm } from './TaskForm';
import { TaskHistoryModal } from './TaskHistoryModal';
import { addCreateAction, addUpdateAction, addDeleteAction } from '../utils/history';

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onTasksChange: () => void;
}

type Filters = typeof FILTERS_DEFAULT;

export const TaskList = ({ tasks, isLoading, onTasksChange }: TaskListProps) => {
  const [filters, setFilters] = useState<Filters>(FILTERS_DEFAULT);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [historyTaskId, setHistoryTaskId] = useState<number | null>(null);
  const [originalTasks] = useState<Map<number, Task>>(new Map());

  const handleSubmitTask = async (formData: TaskCreate) => {
    setIsFormLoading(true);
    setFormError(null);
    try {
      if (editingTask) {
        const fields: Record<string, { oldValue: string; newValue: string }> = {};
        if (editingTask.name !== formData.name) {
          fields.name = { oldValue: editingTask.name, newValue: formData.name };
        }
        if (editingTask.description !== formData.description) {
          fields.description = { oldValue: editingTask.description || '', newValue: formData.description || '' };
        }
        if (editingTask.status !== formData.status) {
          fields.status = { oldValue: editingTask.status, newValue: formData.status || 'todo' };
        }
        if (editingTask.priority !== formData.priority) {
          fields.priority = { oldValue: editingTask.priority, newValue: formData.priority || 'medium' };
        }
        await updateTask(editingTask.id, formData);
        if (Object.keys(fields).length > 0) {
          addUpdateAction(editingTask.id, fields);
        }
      } else {
        const newTask = await createTask(formData);
        addCreateAction(newTask.id);
        originalTasks.set(newTask.id, newTask);
      }
      resetForm();
      onTasksChange();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить задачу?')) return;
    setIsFormLoading(true);
    try {
      await deleteTask(id);
      addDeleteAction(id);
      originalTasks.delete(id);
      onTasksChange();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Ошибка удаления');
    } finally {
      setIsFormLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingTask(null);
    setFormError(null);
  };

  const getStatusBadgeClasses = (status: Task['status']) => {
    const classes: Record<Task['status'], string> = {
      todo: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      done: 'bg-green-100 text-green-800',
    };
    return `px-2 py-1 rounded text-xs ${classes[status]}`;
  };

  const getPriorityBadgeClasses = (priority: Task['priority']) => {
    const classes: Record<Task['priority'], string> = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
    };
    return `px-2 py-1 rounded text-xs ${classes[priority]}`;
  };

  const getStatusLabel = (status: Task['status']) => {
    const labels: Record<Task['status'], string> = {
      todo: 'К выполнению',
      in_progress: 'В работе',
      done: 'Выполнено',
    };
    return labels[status];
  };

  const getPriorityLabel = (priority: Task['priority']) => {
    const labels: Record<Task['priority'], string> = {
      low: 'Низкий',
      medium: 'Средний',
      high: 'Высокий',
    };
    return labels[priority];
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Статус</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="border rounded px-3 py-2"
            >
              <option value="">Все</option>
              <option value="todo">К выполнению</option>
              <option value="in_progress">В работе</option>
              <option value="done">Выполнено</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Приоритет</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="border rounded px-3 py-2"
            >
              <option value="">Все</option>
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">От</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">До</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="border rounded px-3 py-2"
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Новая задача
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">
            {editingTask ? 'Редактировать задачу' : 'Новая задача'}
          </h3>
          <TaskForm
            task={editingTask}
            onSubmit={handleSubmitTask}
            onCancel={resetForm}
            isLoading={isFormLoading}
          />
        </div>
      )}

      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {formError}
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8 text-gray-500">Загрузка...</div>
      )}

      {!isLoading && tasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">Задач пока нет</div>
      )}

      {!isLoading && tasks.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Задача</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Приоритет</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{task.name}</div>
                    {task.description && (
                      <div className="text-sm text-gray-500">{task.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={getStatusBadgeClasses(task.status)}>
                      {getStatusLabel(task.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={getPriorityBadgeClasses(task.priority)}>
                      {getPriorityLabel(task.priority)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{task.date}</td>
                  <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setHistoryTaskId(task.id)}
                        className="text-purple-600 hover:text-purple-800 mr-3"
                      >
                        История
                      </button>
                      <button
                        onClick={() => handleEdit(task)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Удалить
                      </button>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {historyTaskId && (
        <TaskHistoryModal
          taskId={historyTaskId}
          onClose={() => setHistoryTaskId(null)}
        />
      )}
    </div>
  );
};