from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_tenant_id, require_tenant_permission
from app.db.session import get_db
from app.models.product import Product
from app.models.operations import ServiceProductUsage, StockMovement
from app.models.user import User
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate
from app.services.audit import log_tenant_action
from app.services.cache import invalidate_tenant_caches

router = APIRouter(dependencies=[Depends(require_tenant_permission("stock"))])


class StockMovementCreate(BaseModel):
    product_id: str
    qty: int
    type: str = "restock"
    reason: str = "Ajuste manual"


class ServiceUsageItem(BaseModel):
    product_id: str
    qty: int = 1


@router.get("", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    rows = db.execute(select(Product).where(Product.tenant_id == tenant_id).order_by(Product.name)).scalars().all()
    return [ProductOut.model_validate(p, from_attributes=True) for p in rows]


@router.post("", response_model=ProductOut)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    product = Product(tenant_id=tenant_id, **payload.model_dump())
    db.add(product)
    log_tenant_action(db, tenant_id, current_user.full_name, "Estoque", "create", "Cadastrou produto", product.name)
    db.commit()
    db.refresh(product)
    invalidate_tenant_caches(tenant_id)
    return ProductOut.model_validate(product, from_attributes=True)


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: str,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    product = db.scalar(select(Product).where(and_(Product.id == product_id, Product.tenant_id == tenant_id)))
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    for field, value in payload.model_dump().items():
        setattr(product, field, value)
    log_tenant_action(db, tenant_id, current_user.full_name, "Estoque", "update", "Atualizou produto", product.name)
    db.commit()
    db.refresh(product)
    invalidate_tenant_caches(tenant_id)
    return ProductOut.model_validate(product, from_attributes=True)


@router.delete("/{product_id}")
def delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    product = db.scalar(select(Product).where(and_(Product.id == product_id, Product.tenant_id == tenant_id)))
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    log_tenant_action(db, tenant_id, current_user.full_name, "Estoque", "delete", "Removeu produto", product.name)
    db.delete(product)
    db.commit()
    invalidate_tenant_caches(tenant_id)
    return {"message": "Produto removido"}


@router.get("/movements")
def list_stock_movements(db: Session = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    rows = db.execute(
        select(StockMovement).where(StockMovement.tenant_id == tenant_id).order_by(StockMovement.created_at.desc())
    ).scalars().all()
    return [
        {
            "id": row.id,
            "productId": row.product_id,
            "productName": row.product_name,
            "qty": row.qty,
            "type": row.type,
            "appointmentId": row.appointment_id,
            "reason": row.reason,
            "date": row.created_at.strftime("%Y-%m-%d"),
            "createdAt": row.created_at.isoformat(),
        }
        for row in rows
    ]


@router.post("/movements")
def create_stock_movement(
    payload: StockMovementCreate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
):
    product = db.scalar(select(Product).where(and_(Product.id == payload.product_id, Product.tenant_id == tenant_id)))
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    qty = abs(payload.qty)
    movement_type = payload.type
    if movement_type == "consume":
        product.stock = max(0, product.stock - qty)
    elif movement_type in {"restock", "reversal"}:
        product.stock += qty
    row = StockMovement(
        tenant_id=tenant_id,
        product_id=product.id,
        product_name=product.name,
        qty=qty,
        type=movement_type,
        reason=payload.reason,
    )
    db.add(row)
    db.commit()
    return {"id": row.id, "stock": product.stock}


@router.get("/bom")
def list_service_usage(db: Session = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    rows = db.execute(select(ServiceProductUsage).where(ServiceProductUsage.tenant_id == tenant_id)).scalars().all()
    result: dict[str, list[dict]] = {}
    for row in rows:
        result.setdefault(row.service_id, []).append({"productId": row.product_id, "qty": row.qty})
    return result


@router.put("/bom/{service_id}")
def update_service_usage(
    service_id: str,
    payload: list[ServiceUsageItem],
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
):
    rows = db.execute(
        select(ServiceProductUsage).where(and_(ServiceProductUsage.tenant_id == tenant_id, ServiceProductUsage.service_id == service_id))
    ).scalars().all()
    for row in rows:
        db.delete(row)
    for item in payload:
        if item.product_id and item.qty > 0:
            db.add(ServiceProductUsage(tenant_id=tenant_id, service_id=service_id, product_id=item.product_id, qty=item.qty))
    db.commit()
    return {"message": "Composição atualizada"}
