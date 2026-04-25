import { useState, useEffect, useCallback } from 'react';
import { Task, getTasks } from './api';
import { FILTERS_DEFAULT } from './utils/taskUtils';
import { TaskList, Calendar, ChatInterface, TaskModal } from './components';

type ViewMode = 'list' | 'calendar' | 'chat';

const VIEW_LABELS: Record<ViewMode, string> = {
  list: 'Список',
  calendar: 'Календарь',
  chat: 'NL Запрос',
};

const App = () => {
  const [view, setView] = useState<ViewMode>('list');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState(FILTERS_DEFAULT);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
      };
      const response = await getTasks(params);
      setTasks(response.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки задач');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header view={view} onViewChange={setView} />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {view === 'list' && (
          <TaskList
            tasks={tasks}
            isLoading={isLoading}
            onTasksChange={fetchTasks}
          />
        )}

        {view === 'calendar' && (
          <Calendar
            tasks={tasks}
            onTaskClick={setSelectedTask}
          />
        )}

        {view === 'chat' && <ChatInterface />}
      </main>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onTaskChange={fetchTasks}
        />
      )}
    </div>
  );
};

export default App;

interface HeaderProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const Header = ({ view, onViewChange }: HeaderProps) => (
  <header className="bg-white shadow-sm border-b">
    <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-800">Нейро-органайзер</h1>
      <nav className="flex gap-2">
        {(Object.keys(VIEW_LABELS) as ViewMode[]).map((v) => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className={`px-4 py-2 rounded transition-colors ${
              view === v
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {VIEW_LABELS[v]}
          </button>
        ))}
      </nav>
    </div>
  </header>
);