import os
from typing import Optional
from openai import AsyncOpenAI


SYSTEM_PROMPT = '''Ты эксперт по SQLite и таблице tasks со следующей структурой:

```sql
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL CHECK(status IN ('todo','in_progress','done')) DEFAULT 'todo',
    priority TEXT NOT NULL CHECK(priority IN ('low','medium','high')) DEFAULT 'medium',
    tags TEXT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    date TEXT NOT NULL,
    completed_at TEXT NULL
);
```

Твоя задача: Преобразовывать запросы на естественном языке в точные SQLite SELECT-запросы.

Правила:

1. Всегда возвращай ТОЛЬКО SQL-запрос в формате: ```sql SELECT ...; ```
2. НЕ добавляй объяснения, комментарии или текст - только чистый SQL
3. Используй понятные алиасы колонок (name как "Задача", status как "Статус" и т.д.)
4. Форматируй SQL с отступами для читаемости
5. Сортируй по приоритету (high→medium→low) и date DESC по умолчанию
6. Используй функции SQLite: date('now'), date('now', '-N days') и т.д.

Примеры:

Запрос: "Покажи все задачи за сегодня"
```sql
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
```

Запрос: "Покажи выполненные задачи"
```sql
SELECT 
    id,
    name AS "Задача",
    status AS "Статус", 
    priority AS "Приоритет",
    date AS "Дата"
FROM tasks 
WHERE status = 'done'
ORDER BY 
    CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
    date DESC;
```

Генерируй ТОЛЬКО SQL. Никаких объяснений.'''


class OpenAIClient:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY is required")
        self.client = AsyncOpenAI(api_key=self.api_key)
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    async def generate_sql(self, user_query: str, custom_system_prompt: Optional[str] = None) -> str:
        """Generate SQL query from natural language."""
        system_prompt = custom_system_prompt or SYSTEM_PROMPT
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_query}
            ],
            temperature=0.1,
            max_tokens=500,
        )
        
        content = response.choices[0].message.content or ""
        
        # Extract SQL from markdown code blocks
        sql_match = content.find("```sql")
        if sql_match != -1:
            start = sql_match + 6
            end = content.find("```", start)
            if end != -1:
                return content[start:end].strip()
        
        # Try just extracting between ``` and ```
        if "```" in content:
            start = content.find("```") + 3
            end = content.find("```", start)
            if end != -1:
                return content[start:end].strip()
        
        return content.strip()
    
    def close(self):
        pass


_client: Optional[OpenAIClient] = None


def get_openai_client() -> OpenAIClient:
    global _client
    if _client is None:
        _client = OpenAIClient()
    return _client


def close_openai_client():
    global _client
    _client = None