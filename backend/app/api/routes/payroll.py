from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.deps import get_tenant_id, require_tenant_permission
from app.db.session import get_db
from app.models.cash import CashMovement
from app.models.employee import Employee
from app.models.operations import CommissionRecord, PayrollAdvance, PayrollDeduction, PayrollRun

router = APIRouter(dependencies=[Depends(require_tenant_permission("payroll"))])


class AdvanceCreate(BaseModel):
    employee_id: str
    value: int
    reason: str = ""
    date: str | None = None


class DeductionCreate(BaseModel):
    employee_id: str
    month: str
    label: str
    value: int


class PayrollRunCreate(BaseModel):
    employee_id: str
    month: str
    details: dict = Field(default_factory=dict)


def _advance_out(row: PayrollAdvance) -> dict:
    return {
        "id": row.id,
        "employeeId": row.employee_id,
        "employeeName": row.employee_name,
        "date": row.date,
        "value": row.value,
        "reason": row.reason or None,
        "status": row.status,
        "payrollRunId": row.payroll_run_id,
        "createdAt": row.created_at.isoformat(),
    }


@router.get("/state")
def state(db: Session = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    advances = db.execute(select(PayrollAdvance).where(PayrollAdvance.tenant_id == tenant_id)).scalars().all()
    deductions = db.execute(select(PayrollDeduction).where(PayrollDeduction.tenant_id == tenant_id)).scalars().all()
    runs = db.execute(select(PayrollRun).where(PayrollRun.tenant_id == tenant_id).order_by(PayrollRun.paid_at.desc())).scalars().all()
    return {
        "advances": [_advance_out(a) for a in advances],
        "deductions": [
            {
                "id": d.id,
                "employeeId": d.employee_id,
                "employeeName": d.employee_name,
                "month": d.month,
                "label": d.label,
                "value": d.value,
                "createdAt": d.created_at.isoformat(),
            }
            for d in deductions
        ],
        "runs": [
            {
                "id": r.id,
                "month": r.month,
                "employeeId": r.employee_id,
                "employeeName": r.employee_name,
                "gross": r.gross,
                "totalDeductions": r.total_deductions,
                "net": r.net,
                "paidAt": r.paid_at.isoformat(),
                **(r.details or {}),
            }
            for r in runs
        ],
    }


@router.post("/advances")
def add_advance(payload: AdvanceCreate, db: Session = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    employee = db.scalar(select(Employee).where(and_(Employee.id == payload.employee_id, Employee.tenant_id == tenant_id)))
    if not employee:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado")
    row = PayrollAdvance(
        tenant_id=tenant_id,
        employee_id=employee.id,
        employee_name=employee.name,
        value=abs(payload.value),
        reason=payload.reason,
        date=payload.date or datetime.utcnow().strftime("%Y-%m-%d"),
    )
    db.add(row)
    db.add(CashMovement(tenant_id=tenant_id, description=f"Adiantamento - {employee.name}", type="saida", method="Dinheiro", value=row.value))
    db.commit()
    db.refresh(row)
    return _advance_out(row)


@router.post("/deductions")
def add_deduction(payload: DeductionCreate, db: Session = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    employee = db.scalar(select(Employee).where(and_(Employee.id == payload.employee_id, Employee.tenant_id == tenant_id)))
    if not employee:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado")
    row = PayrollDeduction(
        tenant_id=tenant_id,
        employee_id=employee.id,
        employee_name=employee.name,
        month=payload.month,
        label=payload.label,
        value=abs(payload.value),
    )
    db.add(row)
    db.commit()
    return {"id": row.id}


@router.post("/runs")
def run_payroll(payload: PayrollRunCreate, db: Session = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    try:
        month_start = datetime.strptime(f"{payload.month}-01", "%Y-%m-%d")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="Mês inválido") from exc
    month_end = datetime(month_start.year + (month_start.month == 12), month_start.month % 12 + 1, 1)

    employee = db.scalar(select(Employee).where(and_(Employee.id == payload.employee_id, Employee.tenant_id == tenant_id)))
    if not employee:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado")

    existing_run = db.scalar(select(PayrollRun).where(and_(
        PayrollRun.tenant_id == tenant_id,
        PayrollRun.employee_id == employee.id,
        PayrollRun.month == payload.month,
    )))
    if existing_run:
        raise HTTPException(status_code=409, detail="A folha deste funcionário já foi paga neste mês")

    commissions = db.execute(
        select(CommissionRecord).where(
            and_(
                CommissionRecord.tenant_id == tenant_id,
                CommissionRecord.employee_id == employee.id,
                CommissionRecord.status == "pending",
                CommissionRecord.created_at >= month_start,
                CommissionRecord.created_at < month_end,
            )
        )
    ).scalars().all()
    commission_total = sum(c.value for c in commissions)
    advances = db.execute(
        select(PayrollAdvance).where(
            and_(
                PayrollAdvance.tenant_id == tenant_id,
                PayrollAdvance.employee_id == employee.id,
                PayrollAdvance.status == "pending",
                PayrollAdvance.date < month_end.strftime("%Y-%m-%d"),
            )
        )
    ).scalars().all()
    advance_total = sum(a.value for a in advances)
    deductions = db.execute(
        select(PayrollDeduction).where(
            and_(PayrollDeduction.tenant_id == tenant_id, PayrollDeduction.employee_id == employee.id, PayrollDeduction.month == payload.month)
        )
    ).scalars().all()
    other_deductions = sum(d.value for d in deductions)
    gross = employee.salary + commission_total
    inss = round(gross * 0.03)
    irt = round(max(0, gross - 100_000) * 0.10)
    total_deductions = advance_total + other_deductions + inss + irt
    net = max(0, gross - total_deductions)
    details = {
        "base": employee.salary,
        "commissions": commission_total,
        "advances": advance_total,
        "otherDeductions": other_deductions,
        "inss": inss,
        "irt": irt,
    }
    run = PayrollRun(
        tenant_id=tenant_id,
        employee_id=employee.id,
        employee_name=employee.name,
        month=payload.month,
        gross=gross,
        total_deductions=total_deductions,
        net=net,
        details=details,
    )
    db.add(run)
    db.flush()
    for commission in commissions:
        commission.status = "paid"
    for advance in advances:
        advance.status = "deducted"
        advance.payroll_run_id = run.id
    db.add(CashMovement(tenant_id=tenant_id, description=f"Folha salarial - {employee.name}", type="saida", method="Transferência Bancária", value=net))
    db.commit()
    db.refresh(run)
    return {"id": run.id, "net": run.net, "gross": run.gross, "totalDeductions": run.total_deductions}
