import { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { 
  Task, TaskCreate, QueryResponse, 
  getTasks, createTask, updateTask, deleteTask, chatQuery 
} from './api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

type ViewMode = 'list' | 'calendar' | 'chat';
type ResultView = 'table' | 'bar' | 'donut';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

function App() {
  const [view, setView] = useState<ViewMode>('list');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    date_from: '',
    date_to: '',
    sort_by: 'date',
    sort_order: 'desc',
  });
  
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskCreate>({
    name: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    tags: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });
  
  const [chatQueryText, setChatQueryText] = useState('');
  const [chatResult, setChatResult] = useState<QueryResponse | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [resultView, setResultView] = useState<ResultView>('table');
  
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (modalTask) {
      setFormData({
        name: modalTask.name,
        description: modalTask.description,
        status: modalTask.status,
        priority: modalTask.priority,
        tags: modalTask.tags || '',
        date: modalTask.date,
      });
    }
  }, [modalTask]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Parameters<typeof getTasks>[0] = {
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
      setError(e instanceof Error ? e.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingTask) {
        await updateTask(editingTask.id, formData);
      } else {
        await createTask(formData);
      }
      setShowTaskForm(false);
      setEditingTask(null);
      setFormData({
        name: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        tags: '',
        date: format(new Date(), 'yyyy-MM-dd'),
      });
      fetchTasks();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = async (task: Task) => {
    setEditingTask(task);
    setFormData({
      name: task.name,
      description: task.description,
      status: task.status,
      priority: task.priority,
      tags: task.tags || '',
      date: task.date,
    });
    setShowTaskForm(true);
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm('Удалить задачу?')) return;
    setLoading(true);
    try {
      await deleteTask(id);
      fetchTasks();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQueryText.trim()) return;
    setChatLoading(true);
    setError(null);
    try {
      const result = await chatQuery({ query: chatQueryText });
      setChatResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to execute query');
    } finally {
      setChatLoading(false);
    }
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const tasksByDate = tasks.reduce((acc, task) => {
      const dateKey = task.date;
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
            className="p-2 hover:bg-gray-100 rounded"
          >
            ←
          </button>
<h3 className="text-lg font-semibold">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
            className="p-2 hover:bg-gray-100 rounded"
          >
            →
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
            <div key={day} className="text-sm font-medium text-gray-500 py-2">{day}</div>
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
                    onClick={() => { setModalTask(task); setModalMode('view'); }}
                    className={`text-xs truncate p-1 mt-1 rounded cursor-pointer ${
                      task.status === 'done' ? 'bg-green-100 text-green-800' :
                      task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}
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

  const renderChatResult = () => {
    if (!chatResult) return null;
    
    if (chatResult.error) {
      return (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">Ошибка: {chatResult.error}</p>
        </div>
      );
    }

    if (chatResult.rows.length === 0) {
      return (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-gray-600">Нет результатов</p>
        </div>
      );
    }

    const numericColumns = chatResult.columns.filter((col) => {
      const sample = chatResult.rows[0]?.[col];
      return typeof sample === 'number';
    });

    const categoryColumn = chatResult.columns.find((col) => {
      const sample = chatResult.rows[0]?.[col];
      return typeof sample === 'string';
    });

    return (
      <div className="mt-4 space-y-4">
        <div className="flex gap-2">
          {(['table', 'bar', 'donut'] as ResultView[]).map((v) => (
            <button
              key={v}
              onClick={() => setResultView(v)}
              className={`px-3 py-1 rounded ${
                resultView === v 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {v === 'table' ? 'Таблица' : v === 'bar' ? 'Гистограмма' : 'Donut'}
            </button>
          ))}
        </div>

        {resultView === 'table' && (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {chatResult.columns.map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {chatResult.rows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {chatResult.columns.map((col) => (
                      <td key={col} className="px-4 py-3 text-sm text-gray-900">
                        {String(row[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {resultView === 'bar' && numericColumns.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chatResult.rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={categoryColumn || chatResult.columns[0]} tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                {numericColumns.map((col, i) => (
                  <Bar key={col} dataKey={col} fill={COLORS[i % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {resultView === 'donut' && numericColumns.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chatResult.rows}
                  dataKey={numericColumns[0]}
                  nameKey={categoryColumn || chatResult.columns[0]}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {chatResult.rows.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
</PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Нейро-органайзер</h1>
          <nav className="flex gap-2">
            {(['list', 'calendar', 'chat'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded ${
                  view === v 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {v === 'list' ? 'Список' : v === 'calendar' ? 'Календарь' : 'NL Запрос'}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {view === 'list' && (
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
                  onClick={() => setShowTaskForm(true)}
                  className="ml-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  + Новая задача
                </button>
              </div>
            </div>

            {showTaskForm && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold mb-4">
                  {editingTask ? 'Редактировать задачу' : 'Новая задача'}
                </h3>
                <form onSubmit={handleSubmitTask} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Название</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Описание</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Статус</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskCreate['status'] })}
                        className="border rounded px-3 py-2"
                      >
                        <option value="todo">К выполнению</option>
                        <option value="in_progress">В работе</option>
                        <option value="done">Выполнено</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Приоритет</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskCreate['priority'] })}
                        className="border rounded px-3 py-2"
                      >
                        <option value="low">Низкий</option>
                        <option value="medium">Средний</option>
                        <option value="high">Высокий</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Дата</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Теги</label>
                      <input
                        type="text"
                        value={formData.tags || ''}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value || undefined })}
                        placeholder="тег1, тег2"
                        className="border rounded px-3 py-2"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTaskForm(false);
                        setEditingTask(null);
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loading && (
              <div className="text-center py-8 text-gray-500">Загрузка...</div>
            )}

            {!loading && tasks.length === 0 && (
              <div className="text-center py-8 text-gray-500">Задач пока нет</div>
            )}

            {!loading && tasks.length > 0 && (
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
                          <span className={`px-2 py-1 rounded text-xs ${
                            task.status === 'done' ? 'bg-green-100 text-green-800' :
                            task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.status === 'done' ? 'Выполнено' : 
                             task.status === 'in_progress' ? 'В работе' : 'К выполнению'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            task.priority === 'high' ? 'bg-red-100 text-red-800' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {task.priority === 'high' ? 'Высокий' : 
                             task.priority === 'medium' ? 'Средний' : 'Низкий'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{task.date}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleEditTask(task)}
                            className="text-blue-600 hover:text-blue-800 mr-3"
                          >
                            Изменить
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
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
          </div>
        )}

        {view === 'calendar' && renderCalendar()}

        {view === 'chat' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4">Спроси о своих задачах</h3>
              <p className="text-sm text-gray-600 mb-4">
                Примеры: "Покажи все задачи за последний месяц", "Покажи выполненные задачи", "Сколько задач с высоким приоритетом"
              </p>
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={chatQueryText}
                  onChange={(e) => setChatQueryText(e.target.value)}
                  placeholder="Ваш запрос на естественном языке..."
                  className="flex-1 border rounded px-4 py-2"
                />
                <button
                  type="submit"
                  disabled={chatLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {chatLoading ? '...' : 'Отправить'}
                </button>
              </form>
            </div>
            {renderChatResult()}
          </div>
        )}

        {modalTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">
                  {modalMode === 'view' ? 'Просмотр задачи' : 'Редактирование задачи'}
                </h3>
                <button
                  onClick={() => setModalTask(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>
              
              {modalMode === 'view' ? (
                <div className="space-y-3">
                  <div><span className="font-medium">Название:</span> {modalTask.name}</div>
                  <div><span className="font-medium">Описание:</span> {modalTask.description || '-'}</div>
                  <div><span className="font-medium">Статус:</span> {
                    modalTask.status === 'done' ? 'Выполнено' : 
                    modalTask.status === 'in_progress' ? 'В работе' : 'К выполнению'
                  }</div>
                  <div><span className="font-medium">Приоритет:</span> {
                    modalTask.priority === 'high' ? 'Высокий' : 
                    modalTask.priority === 'medium' ? 'Средний' : 'Низкий'
                  }</div>
                  <div><span className="font-medium">Дата:</span> {modalTask.date}</div>
                  {modalTask.tags && <div><span className="font-medium">Теги:</span> {modalTask.tags}</div>}
                  <button
                    onClick={() => setModalMode('edit')}
                    className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Редактировать
                  </button>
                </div>
              ) : (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await updateTask(modalTask.id, formData);
                    setModalTask(null);
                    fetchTasks();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to update task');
                  }
                }} className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Название</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Описание</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">Статус</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskCreate['status'] })}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="todo">К выполнению</option>
                        <option value="in_progress">В работе</option>
                        <option value="done">Выполнено</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">Приоритет</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskCreate['priority'] })}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="low">Низкий</option>
                        <option value="medium">Средний</option>
                        <option value="high">Высокий</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Дата</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(modalTask.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Удалить
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;