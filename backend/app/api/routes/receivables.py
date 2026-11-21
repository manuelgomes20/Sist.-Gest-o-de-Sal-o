from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.deps import get_tenant_id, require_tenant_permission
from app.db.session import get_db
from app.models.cash import CashMovement
from app.models.operations import Receivable, ReceivablePayment

router = APIRouter(dependencies=[Depends(require_tenant_permission("receivables"))])


class ReceivableCreate(BaseModel):
    client: str
    description: str
    total: int
    due_date: str = ""
    appointment_id: str | None = None


class ReceivablePaymentCreate(BaseModel):
    value: int
    method: str = "Dinheiro"


def _out(row: Receivable, payments: list[ReceivablePayment]) -> dict:
    return {
        "id": row.id,
        "appointmentId": row.appointment_id,
        "client": row.client,
        "description": row.description,
        "total": row.total,
        "paid": row.paid,
        "status": row.status,
        "createdAt": row.created_at.isoformat(),
        "dueDate": row.due_date or None,
        "payments": [
            {"id": p.id, "date": p.created_at.strftime("%Y-%m-%d"), "value": p.value, "method": p.method}
            for p in payments
        ],
    }


@router.get("")
def list_receivables(db: Session = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    rows = db.execute(select(Receivable).where(Receivable.tenant_id == tenant_id).order_by(Receivable.created_at.desc())).scalars().all()
    payments = db.execute(select(ReceivablePayment).where(ReceivablePayment.tenant_id == tenant_id)).scalars().all()
    by_receivable: dict[str, list[ReceivablePayment]] = {}
    for payment in payments:
        by_receivable.setdefault(payment.receivable_id, []).append(payment)
    return [_out(row, by_receivable.get(row.id, [])) for row in rows]


@router.post("")
def create_receivable(payload: ReceivableCreate, db: Session = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    row = Receivable(
        tenant_id=tenant_id,
        appointment_id=payload.appointment_id,
        client=payload.client,
        description=payload.description,
        total=payload.total,
        due_date=payload.due_date,
        status="open",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _out(row, [])


@router.post("/{receivable_id}/payments")
def pay_receivable(receivable_id: str, payload: ReceivablePaymentCreate, db: Session = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    row = db.scalar(select(Receivable).where(and_(Receivable.id == receivable_id, Receivable.tenant_id == tenant_id)))
    if not row:
        raise HTTPException(status_code=404, detail="Conta a receber não encontrada")

    value = max(0, min(payload.value, row.total - row.paid))
    payment = ReceivablePayment(tenant_id=tenant_id, receivable_id=row.id, value=value, method=payload.method)
    row.paid += value
    row.status = "paid" if row.paid >= row.total else "partial"
    db.add(payment)
    db.add(CashMovement(tenant_id=tenant_id, description=f"Recebimento - {row.client}", type="entrada", method=payload.method, value=value))
    db.commit()
    db.refresh(row)
    payments = db.execute(select(ReceivablePayment).where(ReceivablePayment.receivable_id == row.id)).scalars().all()
    return _out(row, payments)
