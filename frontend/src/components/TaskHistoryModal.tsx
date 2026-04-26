import { useState, useEffect } from 'react';
import { getTaskHistory, TaskAction } from '../utils/history';

interface TaskHistoryModalProps {
  taskId: number;
  onClose: () => void;
}

const ACTION_LABELS = {
  create: 'Создание',
  update: 'Изменение',
  delete: 'Удаление',
};

const ACTION_COLORS = {
  create: 'bg-blue-100 text-blue-800',
  update: 'bg-green-100 text-green-800',
  delete: 'bg-red-100 text-red-800',
};

const FIELD_LABELS: Record<string, string> = {
  name: 'Название',
  description: 'Описание',
  status: 'Статус',
  priority: 'Приоритет',
  date: 'Дата',
  tags: 'Теги',
};

export const TaskHistoryModal = ({ taskId, onClose }: TaskHistoryModalProps) => {
  const [actions, setActions] = useState<TaskAction[]>([]);

  useEffect(() => {
    const history = getTaskHistory(taskId);
    setActions(history.reverse());
  }, [taskId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">История задачи #{taskId}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {actions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">История пуста</p>
        ) : (
          <div className="space-y-3">
            {actions.map((action, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${ACTION_COLORS[action.action]}`}>
                    {ACTION_LABELS[action.action]}
                  </span>
                  <span className="text-xs text-gray-500">{action.dateTime}</span>
                </div>
                
                {action.fields && Object.keys(action.fields).length > 0 && (
                  <div className="mt-2 space-y-2 text-sm">
                    {Object.entries(action.fields).map(([fieldName, values]) => (
                      <div key={fieldName} className="flex gap-2">
                        <span className="text-gray-600 min-w-[80px]">{FIELD_LABELS[fieldName] || fieldName}:</span>
                        <span className="line-through text-red-600">{values.oldValue || '-'}</span>
                        <span className="text-green-600">→</span>
                        <span className="text-green-600 font-medium">{values.newValue || '-'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};