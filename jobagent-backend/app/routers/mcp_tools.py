from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..crud import get_mcp_tools, get_mcp_tool, create_mcp_tool, update_mcp_tool, update_mcp_tool_admin
from .. import schemas, models
from ..database import get_db
from ..auth import get_current_user, get_current_admin_user
from app.tools.common_tools import get_tool_by_name

router = APIRouter(prefix="/mcp-tools", tags=["mcp-tools"])

@router.get("/", response_model=List[schemas.MCPToolResponse])
def read_mcp_tools(
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[models.MCPToolStatus] = None,
    my_tools: bool = False,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    creator_id = current_user.id if my_tools else None
    tools = get_mcp_tools(db, skip=skip, limit=limit, status=status, creator_id=creator_id)
    return tools

@router.get("/{tool_id}", response_model=schemas.MCPToolResponse)
def read_mcp_tool(tool_id: int, db: Session = Depends(get_db)):
    db_tool = get_mcp_tool(db, tool_id=tool_id)
    if db_tool is None:
        raise HTTPException(status_code=404, detail="MCP Tool not found")
    return db_tool

@router.post("/", response_model=schemas.MCPToolResponse)
def create_new_mcp_tool(
    tool: schemas.MCPToolCreate, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    return create_mcp_tool(db=db, tool=tool, creator_id=current_user.id)

@router.put("/{tool_id}", response_model=schemas.MCPToolResponse)
def update_mcp_tool_endpoint(
    tool_id: int, 
    tool_update: schemas.MCPToolUpdate, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    db_tool = get_mcp_tool(db, tool_id=tool_id)
    if db_tool is None:
        raise HTTPException(status_code=404, detail="MCP Tool not found")
    if db_tool.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    try:
        return update_mcp_tool(db=db, tool_id=tool_id, tool_update=tool_update)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{tool_id}/admin", response_model=schemas.MCPToolResponse)
def admin_update_mcp_tool(
    tool_id: int, 
    admin_update: schemas.MCPToolAdminUpdate, 
    current_admin: models.User = Depends(get_current_admin_user), 
    db: Session = Depends(get_db)
):
    db_tool = get_mcp_tool(db, tool_id=tool_id)
    if db_tool is None:
        raise HTTPException(status_code=404, detail="MCP Tool not found")
    return update_mcp_tool_admin(db=db, tool_id=tool_id, admin_update=admin_update)

@router.post("/{tool_id}/execute", response_model=schemas.MCPToolExecuteResponse)
async def execute_mcp_tool(
    tool_id: int,
    execute_request: schemas.MCPToolExecuteRequest,
    db: Session = Depends(get_db)
):
    db_tool = get_mcp_tool(db, tool_id=tool_id)
    print(f"execute {db_tool} with parameters {execute_request.parameters}")
    if db_tool is None:
        raise HTTPException(status_code=404, detail="MCP Tool not found")

    if not db_tool.api_url.startswith("http"):
        local_tool = get_tool_by_name(db_tool.api_url)
        if local_tool is None:
            raise HTTPException(status_code=404, detail="Local Tool not found")
        response = local_tool(**execute_request.parameters)

        db_tool.sample_input = execute_request.parameters
        mcp_tool_update = schemas.MCPToolUpdate(sample_input=execute_request.parameters)
        update_mcp_tool(db, tool_id, mcp_tool_update)
        return schemas.MCPToolExecuteResponse(
            success=True,
            response={'result': response}
        )

    try:
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.post(
                db_tool.api_url,
                json=execute_request.parameters,
                timeout=30.0
            )
            response.raise_for_status()
            return schemas.MCPToolExecuteResponse(
                success=True,
                response=response.json()
            )
    except Exception as e:
        return schemas.MCPToolExecuteResponse(
            success=False,
            error=str(e)
        )

@router.delete("/{tool_id}", status_code=204)
def delete_mcp_tool_endpoint(
    tool_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_tool = get_mcp_tool(db, tool_id=tool_id)
    if db_tool is None:
        raise HTTPException(status_code=404, detail="MCP Tool not found")
    
    # 检查用户是否是工具的创建者或管理员
    if db_tool.creator_id != current_user.id and current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    if db_tool.status == models.MCPToolStatus.PUBLISHED and current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="Only admins can delete published tools")

    from ..crud import delete_mcp_tool
    if delete_mcp_tool(db=db, tool_id=tool_id):
        return {"message": "Tool deleted successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to delete tool")
