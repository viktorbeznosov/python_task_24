import os
from pathlib import Path

import aiosqlite
from sqlmodel import SQLModel, Field
from typing import Optional, List
from datetime import datetime


DATABASE_PATH = Path(os.getenv("DATABASE_PATH", "/app/data/tasks.db"))
DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)


class Task(SQLModel, table=True):
    __tablename__ = "tasks"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: str = ""
    status: str = "todo"
    priority: str = "medium"
    tags: Optional[str] = None
    created_at: str
    updated_at: str
    date: str
    completed_at: Optional[str] = None


async def init_db():
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
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
            )
        """)
        
        await db.execute("CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at)")
        
        await db.commit()


async def get_tasks_list(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    tags: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    sort_by: str = "date",
    sort_order: str = "desc",
    limit: int = 100,
    offset: int = 0,
) -> List[Task]:
    query = "SELECT * FROM tasks WHERE 1=1"
    params = []
    
    if status:
        query += " AND status = ?"
        params.append(status)
    if priority:
        query += " AND priority = ?"
        params.append(priority)
    if tags:
        query += " AND tags LIKE ?"
        params.append(f"%{tags}%")
    if date_from:
        query += " AND date >= ?"
        params.append(date_from)
    if date_to:
        query += " AND date <= ?"
        params.append(date_to)
    
    sort_columns = {"date": "date", "priority": "priority", "created_at": "created_at", "name": "name"}
    sort_col = sort_columns.get(sort_by, "date")
    sort_dir = "DESC" if sort_order == "desc" else "ASC"
    query += f" ORDER BY {sort_col} {sort_dir}"
    
    query += " LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(query, params) as cursor:
            rows = await cursor.fetchall()
            return [Task(**dict(row)) for row in rows]


async def get_task_by_id(task_id: int) -> Optional[Task]:
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)) as cursor:
            row = await cursor.fetchone()
            if row:
                return Task(**dict(row))
            return None


async def create_task(task_data: dict) -> int:
    now = datetime.now().isoformat()
    date = task_data.get("date") or datetime.now().strftime("%Y-%m-%d")
    
    async with aiosqlite.connect(DATABASE_PATH) as db:
        async with db.execute(
            """INSERT INTO tasks (name, description, status, priority, tags, created_at, updated_at, date, completed_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (task_data["name"], task_data.get("description", ""), task_data.get("status", "todo"), 
             task_data.get("priority", "medium"), task_data.get("tags"), 
             now, now, date, task_data.get("completed_at"))
        ) as cursor:
            await db.commit()
            return cursor.lastrowid


async def update_task(task_id: int, task_data: dict) -> bool:
    now = datetime.now().isoformat()
    
    async with aiosqlite.connect(DATABASE_PATH) as db:
        async with db.execute(
            """UPDATE tasks SET name=?, description=?, status=?, priority=?, tags=?, updated_at=?, date=?, completed_at=?
               WHERE id=?""",
            (task_data["name"], task_data.get("description", ""), task_data.get("status", "todo"),
             task_data.get("priority", "medium"), task_data.get("tags"),
             now, task_data.get("date"), task_data.get("completed_at"), task_id)
        ) as cursor:
            await db.commit()
            return cursor.rowcount > 0


async def delete_task(task_id: int) -> bool:
    async with aiosqlite.connect(DATABASE_PATH) as db:
        async with db.execute("DELETE FROM tasks WHERE id = ?", (task_id,)) as cursor:
            await db.commit()
            return cursor.rowcount > 0


async def execute_raw_sql(sql: str) -> tuple[list[str], list[dict]]:
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(sql) as cursor:
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            rows = await cursor.fetchall()
            return columns, [dict(row) for row in rows]