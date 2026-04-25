import { useState } from 'react';
import { QueryResponse, chatQuery } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

type ResultView = 'table' | 'bar' | 'donut';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
const VIEW_LABELS: Record<ResultView, string> = {
  table: 'Таблица',
  bar: 'Гистограмма',
  donut: 'Круговая',
};

const PLACEHOLDER = 'Ваш запрос на естественном языке...';
const EXAMPLES = 'Примеры: "Покажи все задачи за последний месяц", "Покажи выполненные задачи", "Сколько задач с высоким приоритетом"';

export const ChatInterface = () => {
  const [queryText, setQueryText] = useState('');
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultView, setResultView] = useState<ResultView>('table');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!queryText.trim()) {
      setError('Введите запрос');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await chatQuery({ query: queryText });
      setResult(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка выполнения запроса');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (value: string) => {
    setQueryText(value);
    if (error) setError(null);
  };

  const numericColumns = result?.columns.filter((col) => {
    const sample = result?.rows[0]?.[col];
    return typeof sample === 'number';
  }) || [];

  const categoryColumn = result?.columns.find((col) => {
    const sample = result?.rows[0]?.[col];
    return typeof sample === 'string';
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Спроси о своих задачах</h3>
        <p className="text-sm text-gray-600 mb-4">{EXAMPLES}</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <div className="flex gap-2">
            <input
              type="text"
              value={queryText}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={PLACEHOLDER}
              className="flex-1 border rounded px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? '...' : 'Отправить'}
            </button>
          </div>
        </form>
      </div>

      {result && renderResult(result, resultView, setResultView, numericColumns, categoryColumn)}
    </div>
  );
};

const renderResult = (
  result: QueryResponse,
  resultView: ResultView,
  setResultView: (v: ResultView) => void,
  numericColumns: string[],
  categoryColumn?: string
) => {
  if (result.error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Ошибка: {result.error}</p>
      </div>
    );
  }

  if (result.rows.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600">Нет результатов</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex gap-2">
        {(Object.keys(VIEW_LABELS) as ResultView[]).map((v) => (
          <button
            key={v}
            onClick={() => setResultView(v)}
            className={`px-3 py-1 rounded ${
              resultView === v
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>

      {resultView === 'table' && (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {result.columns.map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {result.rows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  {result.columns.map((col) => (
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
            <BarChart data={result.rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={categoryColumn || result.columns[0]} tick={{ fontSize: 12 }} />
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
                data={result.rows}
                dataKey={numericColumns[0]}
                nameKey={categoryColumn || result.columns[0]}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {result.rows.map((_, i) => (
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