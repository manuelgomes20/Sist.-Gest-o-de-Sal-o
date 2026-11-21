from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.deps import get_tenant_id, require_tenant_permission
from app.db.session import get_db
from app.models.operations import AlertRecord
from app.models.product import Product
from app.models.tenant_settings import TenantSettings

router = APIRouter(dependencies=[Depends(require_tenant_permission("alerts"))])

DEFAULT_ALERT_CONFIG = {
    "stock": {"enabled": True, "threshold": 5, "repeatMinutes": 60, "sound": False, "popup": True},
    "appointments": {"enabled": True, "leadMinutes": 15, "repeatMinutes": 5, "sound": True, "popup": True},
    "quietHours": {"enabled": False, "start": "22:00", "end": "07:00"},
}


class AlertConfigPayload(BaseModel):
    config: dict


@router.get("")
def list_alerts(db: Session = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    rows = db.execute(select(AlertRecord).where(AlertRecord.tenant_id == tenant_id).order_by(AlertRecord.created_at.desc())).scalars().all()
    stored = [
        {
            "id": row.id,
            "title": row.title,
            "message": row.message,
            "severity": row.severity,
            "read": row.read,
            "createdAt": row.created_at.isoformat(),
        }
        for row in rows
    ]
    low_stock = db.execute(select(Product).where(and_(Product.tenant_id == tenant_id, Product.stock <= Product.min_stock))).scalars().all()
    generated = [
        {
            "id": f"stock-{p.id}",
            "title": "Stock baixo",
            "message": f"{p.name} está com {p.stock} unidades.",
            "severity": "warning",
            "read": False,
            "createdAt": "",
        }
        for p in low_stock
    ]
    return generated + stored


@router.patch("/{alert_id}/read")
def mark_read(alert_id: str, db: Session = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    row = db.scalar(select(AlertRecord).where(and_(AlertRecord.id == alert_id, AlertRecord.tenant_id == tenant_id)))
    if not row:
        raise HTTPException(status_code=404, detail="Alerta não encontrado")
    row.read = True
    db.commit()
    return {"message": "Alerta marcado como lido"}


@router.get("/config")
def get_config(db: Session = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    settings = db.scalar(select(TenantSettings).where(TenantSettings.tenant_id == tenant_id))
    if not settings or not settings.alert_config:
        return DEFAULT_ALERT_CONFIG
    return {
        "stock": {**DEFAULT_ALERT_CONFIG["stock"], **(settings.alert_config.get("stock") or {})},
        "appointments": {**DEFAULT_ALERT_CONFIG["appointments"], **(settings.alert_config.get("appointments") or {})},
        "quietHours": {**DEFAULT_ALERT_CONFIG["quietHours"], **(settings.alert_config.get("quietHours") or {})},
    }


@router.put("/config")
def update_config(payload: AlertConfigPayload, db: Session = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    settings = db.scalar(select(TenantSettings).where(TenantSettings.tenant_id == tenant_id))
    if not settings:
        settings = TenantSettings(tenant_id=tenant_id)
        db.add(settings)
    settings.alert_config = {
        "stock": {**DEFAULT_ALERT_CONFIG["stock"], **(payload.config.get("stock") or {})},
        "appointments": {**DEFAULT_ALERT_CONFIG["appointments"], **(payload.config.get("appointments") or {})},
        "quietHours": {**DEFAULT_ALERT_CONFIG["quietHours"], **(payload.config.get("quietHours") or {})},
    }
    db.commit()
    return settings.alert_config
