export interface TaskAction {
  action: 'create' | 'update' | 'delete';
  fields?: Record<string, { oldValue: string; newValue: string }>;
  dateTime: string;
}

export interface TaskHistoryItem {
  id: number;
  actions: TaskAction[];
}

export interface TaskHistory {
  data: TaskHistoryItem[];
}

const STORAGE_KEY = 'task_history';

export const getHistory = (): TaskHistory => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading history:', e);
  }
  return { data: [] };
};

export const saveHistory = (history: TaskHistory): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Error saving history:', e);
  }
};

export const addCreateAction = (taskId: number): void => {
  const history = getHistory();
  let item = history.data.find((t) => t.id === taskId);
  
  if (!item) {
    item = { id: taskId, actions: [] };
    history.data.push(item);
  }
  
  item.actions.push({
    action: 'create',
    dateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
  });
  
  saveHistory(history);
};

export const addUpdateAction = (taskId: number, fields: Record<string, { oldValue: string; newValue: string }>): void => {
  const history = getHistory();
  let item = history.data.find((t) => t.id === taskId);
  
  if (!item) {
    item = { id: taskId, actions: [] };
    history.data.push(item);
  }
  
  item.actions.push({
    action: 'update',
    fields,
    dateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
  });
  
  saveHistory(history);
};

export const addDeleteAction = (taskId: number): void => {
  const history = getHistory();
  let item = history.data.find((t) => t.id === taskId);
  
  if (!item) {
    item = { id: taskId, actions: [] };
    history.data.push(item);
  }
  
  item.actions.push({
    action: 'delete',
    dateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
  });
  
  saveHistory(history);
};

export const getTaskHistory = (taskId: number): TaskAction[] => {
  const history = getHistory();
  const item = history.data.find((t) => t.id === taskId);
  return item?.actions || [];
};

export const clearHistory = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};