# Техническое задание для Cursor AI: "Домашний нейро-органайзер"

Нужно создать full-stack веб-приложение "Домашний нейро-органайзер" для управления задачами и интеллектуального просмотра задач по естественным текстовым запросам.

## 1. Цель

Сделай простое, современное и рабочее приложение, которое:

- запускается одной командой локально и на сервере:
  `docker compose up -d --build`
- использует один Docker-образ;
- отдаёт frontend и backend с одного origin;
- не требует CORS;
- использует SQLite как основную БД;
- поддерживает CRUD задач;
- поддерживает просмотр задач списком, календарём и через natural language запросы к LLM;
- использует модель `gpt-4o-mini` для преобразования запроса пользователя в безопасный SQL `SELECT` для SQLite;
- умеет отображать результат как таблицу, гистограмму или donut chart;
- имеет аккуратный современный UI на React + TypeScript + Tailwind.

## 2. Стек

### Backend
- Python 3.11
- FastAPI
- Uvicorn
- Pydantic v2
- SQLModel или SQLAlchemy + Pydantic
- SQLite
- OpenAI API
- SSE для streaming ответов
- SessionMiddleware

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS

## 3. Архитектура

Сделай один контейнер:
- frontend собирается через Vite в `dist`;
- backend на FastAPI раздаёт API и собранную статику;
- same-origin: frontend по `/`, API по `/api/*`;
- база SQLite хранится в `/app/data/tasks.db`.

FastAPI должен раздавать SPA и static files из `/app/frontend_dist`. `FRONTEND_DIST` можно переопределить через env. FastAPI поддерживает mounted static files через `StaticFiles`, это и нужно использовать. [page:1]

## 4. Модель данных

Создай таблицу `tasks` в SQLite:

CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL CHECK(status IN ('todo','in_progress','done')) DEFAULT 'todo',
    priority TEXT NOT NULL CHECK(priority IN ('low','medium','high')) DEFAULT 'medium',
    tags TEXT NULL, -- JSON массив или строка "tag1,tag2"
    created_at TEXT NOT NULL, -- ISO формат: '2026-04-25 12:22:00'
    updated_at TEXT NOT NULL, -- ISO формат: '2026-04-25 12:22:00'
    date TEXT NOT NULL, -- дата в формате 'YYYY-MM-DD'
    completed_at TEXT NULL -- ISO формат или NULL
);

Храни даты в формате `YYYY-MM-DD`, datetime — в ISO 8601.

Создай индексы по:
- `date`
- `status`
- `priority`
- `created_at`

## 5. Backend API

Реализуй:

- `GET /healthz`
- `GET /api/v1/tasks`
  - фильтрация по `status`, `priority`, `category`
  - диапазон дат: `date_from`, `date_to`
  - сортировка: `sort_by`, `sort_order`
  - пагинация: `limit`, `offset`
- `GET /api/v1/tasks/{id}`
- `POST /api/v1/tasks/item`
- `PUT /api/v1/tasks/item/{id}`
- `DELETE /api/v1/tasks/item/{id}`
- `POST /api/v1/chat/query`
  - принимает natural language запрос пользователя, например:
    - "Покажи все мои задачи за последний месяц"
    - "Покажи все выполненные задачи с 2026-01-01 по 2026-01-10"
  - backend отправляет запрос в OpenAI
  - модель возвращает только SQL SELECT для SQLite
  - backend валидирует SQL и выполняет его
  - ответ возвращает:
    - исходный запрос
    - сгенерированный SQL
    - строки результата
    - агрегированные данные для таблицы/гистограммы/donut
- `GET /api/v1/chat/stream`
  - SSE endpoint с `text/event-stream`

## 6. Безопасность SQL

Очень важно:
- LLM может генерировать только `SELECT`
- запретить `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `ATTACH`, `PRAGMA`
- запретить multiple statements (`;`)
- разрешить запросы только к таблице `tasks`
- перед выполнением делать серверную валидацию SQL строкой и простыми правилами
- если SQL невалиден, не выполнять его и возвращать ошибку

По возможности сначала проси модель возвращать SQL в структурированном формате, а не свободным текстом, так как structured outputs уменьшают зависимость от жёсткого prompt-engineering и делают формат ответа стабильнее. [web:9]

## 6.1 Системный промпт для генерации SQL запросов

Системный промпт для генерации SQL-запросов

Ты эксперт по SQLite и таблице tasks со следующей структурой:

sql
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL CHECK(status IN ('todo','in_progress','done')) DEFAULT 'todo',
    priority TEXT NOT NULL CHECK(priority IN ('low','medium','high')) DEFAULT 'medium',
    tags TEXT NULL, -- JSON массив или строка "tag1,tag2"
    created_at TEXT NOT NULL, -- ISO формат: '2026-04-25 12:22:00'
    updated_at TEXT NOT NULL, -- ISO формат: '2026-04-25 12:22:00'
    date TEXT NOT NULL, -- дата в формате 'YYYY-MM-DD'
    completed_at TEXT NULL -- ISO формат или NULL
);
Твоя задача: Преобразовывать запросы на естественном языке в точные SQLite SELECT-запросы.

Правила:

Всегда возвращай ТОЛЬКО SQL-запрос в формате:

text
```sql
SELECT ...;
```
НЕ добавляй объяснения, комментарии или текст - только чистый SQL

Используй понятные алиасы колонок (name как "Задача", status как "Статус" и т.д.)

Форматируй SQL с отступами для читаемости

Сортируй по приоритету (high→medium→low) и date DESC по умолчанию

Поддерживаемые запросы:

text
Даты:
- "за сегодня" → WHERE date = CURRENT_DATE
- "за вчера" → WHERE date = date('now', '-1 day')
- "за последний месяц" → WHERE date >= date('now', '-30 days')
- "с 01.01.2026 по 30.04.2026" → WHERE date BETWEEN '2026-01-01' AND '2026-04-30'

Статусы: todo, in_progress, done
Приоритеты: low, medium, high  
Теги: поиск по подстроке в tags LIKE '%тег%'
Задачи: все поля (id, name, description, status, priority, tags, date)
Примеры ожидаемого вывода:

Запрос: "Покажи все задачи за сегодня"

sql
SELECT 
    id,
    name AS "Задача",
    status AS "Статус", 
    priority AS "Приоритет",
    date AS "Дата",
    tags
FROM tasks 
WHERE date = date('now')
ORDER BY 
    CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
    date DESC;

Генерируй ТОЛЬКО SQL. Никаких объяснений.

## 7. Frontend

Сделай интерфейс со страницами/блоками:
- список задач;
- форма создания/редактирования задачи;
- календарный просмотр;
- NL query блок ("спросить про мои задачи");
- выбор вида отображения результата: table / bar / donut;
- редактирование system prompt;
- индикаторы загрузки и ошибок.

Все API-запросы делай через относительные пути (`/api/...`), без абсолютных URL.

## 8. UI

Требования:
- современный чистый UI;
- Tailwind;
- адаптивность;
- светлая тема;
- удобная таблица;
- фильтры и сортировки;
- empty states;
- error states;
- loading states.

## 9. Docker

Сделай multi-stage Dockerfile:
- stage 1: сборка frontend;
- stage 2: backend + копирование `dist` в `/app/frontend_dist`.

Запуск:
`docker compose up -d --build`

## 10. Env

Используй один `.env`:
- `OPENAI_API_KEY`
- `SESSION_SECRET`
- `PUBLIC_PORT`
- `FRONTEND_DIST` (опционально)

## 11. Что нужно сгенерировать

Сгенерируй полностью рабочую структуру проекта:

- `backend/app.py`
- `backend/models.py`
- `backend/db.py`
- `backend/openai_client.py`
- `backend/sql_guard.py`
- `backend/requirements.txt`
- `frontend/src/App.tsx`
- `frontend/src/api.ts`
- `frontend/src/components/...`
- `Dockerfile`
- `compose.yaml`

## 12. Требования к качеству

- Код должен запускаться без ручных исправлений
- Все импорты должны быть корректными
- Не оставляй заглушки TODO
- Если принимаешь архитектурное решение — делай его последовательно во всём проекте
- Не смешивай домен задач с доменом бюджета
- Используй осмысленные имена функций, схем и DTO
