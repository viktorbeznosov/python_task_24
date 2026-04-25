# Нейро-органайзер

Умный органайзер задач с поддержкой естественного языка для запросов к базе данных.

## Возможности

- **Управление задачами (CRUD)** - создание, чтение, обновление, удаление задач
- **Фильтрация и сортировка** - по статусу, приоритету, датам
- **Календарный вид** - просмотр задач по месяцам с кликом для просмотра/редактирования
- **NL запросы** - естественным языком (например: "Покажи задачи за сегодня")
- **Визуализация** - таблица, гистограмма, donut chart

## Стек

- **Backend**: Python 3.11, FastAPI, SQLite, OpenAI (gpt-4o-mini)
- **Frontend**: React, TypeScript, Tailwind CSS, Recharts
- **Docker**: Single container deployment

## Запуск

```bash
# Клонировать репозиторий
cd neuro

# Настроить переменные окружения
cp .env.example .env
# Добавить OPENAI_API_KEY в .env

# Запустить
docker compose up -d --build

# Открыть в браузере
http://localhost:8000
```

## API Endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/healthz` | Health check |
| GET | `/api/v1/tasks` | Список задач с фильтрацией |
| GET | `/api/v1/tasks/{id}` | Одна задача |
| POST | `/api/v1/tasks/item` | Создать задачу |
| PUT | `/api/v1/tasks/item/{id}` | Обновить задачу |
| DELETE | `/api/v1/tasks/item/{id}` | Удалить задачу |
| POST | `/api/v1/chat/query` | NL запрос |

## Примеры NL запросов

- "Покажи все задачи за сегодня"
- "Покажи выполненные задачи"
- "Сколько задач с высоким приоритетом"
- "Задачи за последний месяц"

## Структура проекта

```
neuro/
├── backend/
│   ├── app.py          # FastAPI приложение
│   ├── db.py          # SQLite операции
│   ├── models.py      # Pydantic модели
│   ├── openai_client.py  # OpenAI клиент
│   ├── sql_guard.py  # Валидация SQL
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx   # React UI
│   │   └── api.ts   # API функции
│   └── ...
├── Dockerfile
├── compose.yaml
├── .env
└── .env.example
```

## Лицензия

MIT