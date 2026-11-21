from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.deps import get_tenant_id, require_tenant_permission
from app.db.session import get_db
from app.models.employee import Employee
from app.models.operations import AttendanceRecord
from app.models.tenant_settings import TenantSettings

router = APIRouter(dependencies=[Depends(require_tenant_permission("attendance"))])


class AttendancePayload(BaseModel):
    employee_id: str
    date: str | None = None
    check_in: str = ""
    check_out: str = ""
    expected_in: str = "08:00"
    late_minutes: int = 0
    status: str = "present"
    note: str = ""


class AttendanceSettingsPayload(BaseModel):
    settings: dict


def _out(record: AttendanceRecord) -> dict:
    return {
        "id": record.id,
        "employeeId": record.employee_id,
        "employeeName": record.employee_name,
        "date": record.date,
        "checkIn": record.check_in or None,
        "checkOut": record.check_out or None,
        "expectedIn": record.expected_in,
        "lateMinutes": record.late_minutes,
        "status": record.status,
        "note": record.note or None,
        "createdAt": record.created_at.isoformat(),
    }


@router.get("/records")
def list_records(db: Session = Depends(get_db), tenant_id: str = Depends(get_tenant_id), month: str | None = None):
    stmt = select(AttendanceRecord).where(AttendanceRecord.tenant_id == tenant_id).order_by(AttendanceRecord.date.desc())
    rows = db.execute(stmt).scalars().all()
    if month:
        rows = [row for row in rows if row.date.startswith(month)]
    return [_out(row) for row in rows]


@router.post("/records")
def upsert_record(payload: AttendancePayload, db: Session = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    employee = db.scalar(select(Employee).where(and_(Employee.id == payload.employee_id, Employee.tenant_id == tenant_id)))
    if not employee:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado")

    record_date = payload.date or datetime.utcnow().strftime("%Y-%m-%d")
    record = db.scalar(
        select(AttendanceRecord).where(
            and_(
                AttendanceRecord.tenant_id == tenant_id,
                AttendanceRecord.employee_id == employee.id,
                AttendanceRecord.date == record_date,
            )
        )
    )
    if not record:
        record = AttendanceRecord(tenant_id=tenant_id, employee_id=employee.id, employee_name=employee.name, date=record_date)
        db.add(record)

    record.employee_name = employee.name
    record.check_in = payload.check_in
    record.check_out = payload.check_out
    record.expected_in = payload.expected_in
    record.late_minutes = payload.late_minutes
    record.status = payload.status
    record.note = payload.note
    db.commit()
    db.refresh(record)
    return _out(record)


@router.delete("/records/{record_id}")
def delete_record(record_id: str, db: Session = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    record = db.scalar(select(AttendanceRecord).where(and_(AttendanceRecord.id == record_id, AttendanceRecord.tenant_id == tenant_id)))
    if not record:
        raise HTTPException(status_code=404, detail="Registo não encontrado")
    db.delete(record)
    db.commit()
    return {"message": "Registo removido"}


@router.get("/settings")
def get_settings(db: Session = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    settings = db.scalar(select(TenantSettings).where(TenantSettings.tenant_id == tenant_id))
    return settings.attendance_settings if settings and settings.attendance_settings else {
        "shiftStart": "08:00",
        "toleranceMinutes": 10,
        "workingDaysPerMonth": 22,
        "shiftHours": 8,
    }


@router.put("/settings")
def update_settings(payload: AttendanceSettingsPayload, db: Session = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    settings = db.scalar(select(TenantSettings).where(TenantSettings.tenant_id == tenant_id))
    if not settings:
        settings = TenantSettings(tenant_id=tenant_id)
        db.add(settings)
    settings.attendance_settings = payload.settings
    db.commit()
    return settings.attendance_settings
