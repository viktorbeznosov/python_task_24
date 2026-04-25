from typing import Optional, List
from pydantic import BaseModel, Field


class TaskBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=500)
    description: str = Field(default="")
    status: str = Field(default="todo")
    priority: str = Field(default="medium")
    tags: Optional[str] = Field(default=None)
    date: str = Field(default="")
    completed_at: Optional[str] = Field(default=None)


class TaskCreate(TaskBase):
    pass


class TaskUpdate(TaskBase):
    pass


class TaskResponse(TaskBase):
    id: int
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    items: List[TaskResponse]
    total: int
    limit: int
    offset: int


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1)


class QueryResponse(BaseModel):
    original_query: str
    generated_sql: str
    columns: List[str]
    rows: List[dict]
    error: Optional[str] = None


class ChatStreamRequest(BaseModel):
    query: str = Field(..., min_length=1)


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    timestamp: str