from fastapi import APIRouter, Depends
from datetime import datetime

from fastapi import HTTPException, Query
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.deps import get_tenant_id, require_tenant_permission
from app.core.redis_client import cache_get_json, cache_set_json
from app.db.session import get_db
from app.models.appointment import Appointment
from app.models.employee import Employee
from app.models.operations import CommissionRecord
from app.schemas.financial import CommissionItem, CommissionSummary, FinancialSummary
from app.services.analytics import build_financial_summary

router = APIRouter()


@router.get("/summary", response_model=FinancialSummary)
def summary(
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    _: str = Depends(require_tenant_permission("financial")),
):
    settings = get_settings()
    cache_key = f"financial:summary:{tenant_id}"
    cached = cache_get_json(cache_key)
    if cached:
        return FinancialSummary(**cached)

    data = build_financial_summary(db, tenant_id)
    cache_set_json(cache_key, data, ttl_seconds=settings.cache_ttl_seconds)
    return FinancialSummary(**data)


@router.get("/commissions", response_model=CommissionSummary)
def commissions(
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    _: str = Depends(require_tenant_permission("commissions")),
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
):
    date_range = None
    if month:
        try:
            start = datetime.strptime(f"{month}-01", "%Y-%m-%d")
        except ValueError as exc:
            raise HTTPException(status_code=422, detail="Mês inválido") from exc
        end = datetime(start.year + (start.month == 12), start.month % 12 + 1, 1)
        date_range = (start, end)

    employees = db.execute(
        select(Employee).where(and_(Employee.tenant_id == tenant_id, Employee.type == "servico"))
    ).scalars().all()

    items: list[CommissionItem] = []
    total_commissions = 0

    for emp in employees:
        filters = [
            CommissionRecord.tenant_id == tenant_id,
            CommissionRecord.employee_id == emp.id,
            CommissionRecord.status == "pending",
        ]
        if date_range:
            filters.extend([
                CommissionRecord.created_at >= date_range[0],
                CommissionRecord.created_at < date_range[1],
            ])
        commission_rows = db.execute(select(CommissionRecord).where(and_(*filters))).scalars().all()
        total_revenue = sum(c.price for c in commission_rows)
        appointments_count = len(commission_rows)
        commission_value = sum(c.value for c in commission_rows)
        total_commissions += commission_value
        items.append(
            CommissionItem(
                id=emp.id,
                name=emp.name,
                role=emp.role,
                appointments=int(appointments_count),
                total_revenue=int(total_revenue),
                commission_rate=emp.commission,
                commission_value=commission_value,
            )
        )

    return CommissionSummary(total_commissions=total_commissions, items=items)
