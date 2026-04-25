import os
import json
from pathlib import Path
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles

from backend.models import (
    TaskCreate, TaskUpdate, TaskResponse, TaskListResponse,
    QueryRequest, QueryResponse, HealthResponse
)
import backend.db as db
from backend.sql_guard import validate_sql
from backend.openai_client import get_openai_client


FRONTEND_DIST = os.getenv("FRONTEND_DIST", "/app/frontend_dist")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.init_db()
    if Path(FRONTEND_DIST).exists():
        app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="static")
    yield


app = FastAPI(
    title="Neuro Organizer API",
    version="1.0.0",
    lifespan=lifespan
)


@app.get("/healthz", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="ok", timestamp=datetime.now().isoformat())


@app.get("/api/v1/tasks", response_model=TaskListResponse)
async def get_tasks(
    status: str | None = None,
    priority: str | None = None,
    tags: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    sort_by: str = "date",
    sort_order: str = "desc",
    limit: int = 100,
    offset: int = 0,
):
    tasks = await db.get_tasks_list(
        status=status,
        priority=priority,
        tags=tags,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_order=sort_order,
        limit=limit,
        offset=offset,
    )
    return TaskListResponse(
        items=[TaskResponse(**task.model_dump()) for task in tasks],
        total=len(tasks),
        limit=limit,
        offset=offset,
    )


@app.get("/api/v1/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int):
    task = await db.get_task_by_id(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskResponse(**task.model_dump())


@app.post("/api/v1/tasks/item", response_model=TaskResponse, status_code=201)
async def create_task(task: TaskCreate):
    task_id = await db.create_task(task.model_dump())
    created_task = await db.get_task_by_id(task_id)
    return TaskResponse(**created_task.model_dump())


@app.put("/api/v1/tasks/item/{task_id}", response_model=TaskResponse)
async def update_task(task_id: int, task: TaskUpdate):
    success = await db.update_task(task_id, task.model_dump())
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    updated_task = await db.get_task_by_id(task_id)
    return TaskResponse(**updated_task.model_dump())


@app.delete("/api/v1/tasks/item/{task_id}")
async def delete_task(task_id: int):
    success = await db.delete_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"success": True}


@app.post("/api/v1/chat/query", response_model=QueryResponse)
async def chat_query(request: QueryRequest):
    try:
        openai = get_openai_client()
        sql = await openai.generate_sql(request.query)
        
        is_valid, error = validate_sql(sql)
        if not is_valid:
            return QueryResponse(
                original_query=request.query,
                generated_sql=sql,
                columns=[],
                rows=[],
                error=error,
            )
        
        columns, rows = await db.execute_raw_sql(sql)
        
        return QueryResponse(
            original_query=request.query,
            generated_sql=sql,
            columns=columns,
            rows=rows,
            error=None,
        )
    except Exception as e:
        return QueryResponse(
            original_query=request.query,
            generated_sql="",
            columns=[],
            rows=[],
            error=str(e),
        )


async def generate_stream(query: str):
    """Generator for SSE streaming."""
    try:
        openai = get_openai_client()
        sql = await openai.generate_sql(query)
        
        is_valid, error = validate_sql(sql)
        if not is_valid:
            yield f"data: {json.dumps({'type': 'error', 'message': error})}\n\n"
            return
        
        columns, rows = await db.execute_raw_sql(sql)
        
        yield f"data: {json.dumps({'type': 'sql', 'sql': sql})}\n\n"
        yield f"data: {json.dumps({'type': 'result', 'columns': columns, 'rows': rows})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
        
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"


@app.get("/api/v1/chat/stream")
async def chat_stream(query: str = Query(...)):
    return StreamingResponse(
        generate_stream(query),
        media_type="text/event-stream",
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PUBLIC_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)