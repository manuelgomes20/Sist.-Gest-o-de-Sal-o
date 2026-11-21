from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_tenant_id, require_tenant_permission
from app.db.session import get_db
from app.models.appointment import Appointment
from app.models.cash import CashMovement
from app.models.client import Client
from app.models.employee import Employee
from app.models.operations import CommissionRecord, Receivable, ServiceProductUsage, StockMovement
from app.models.product import Product
from app.models.service import Service
from app.models.user import User
from app.schemas.appointment import AppointmentCreate, AppointmentOut, AppointmentUpdate
from app.services.audit import log_tenant_action
from app.services.cache import invalidate_tenant_caches

router = APIRouter(dependencies=[Depends(require_tenant_permission("agenda"))])


class FinalizeAppointmentPayload(BaseModel):
    payment_method: str = "Dinheiro"
    paid_value: int | None = None
    due_date: str = ""


def _to_out(a: Appointment, client_name: str, service_name: str, employee_name: str) -> AppointmentOut:
    return AppointmentOut(
        id=a.id,
        client_id=a.client_id,
        service_id=a.service_id,
        employee_id=a.employee_id,
        client=client_name,
        service=service_name,
        employee=employee_name,
        date=a.start_at.strftime("%Y-%m-%d"),
        time=a.start_at.strftime("%H:%M"),
        start_at=a.start_at,
        status=a.status,
        price=a.price,
    )


@router.get("", response_model=list[AppointmentOut])
def list_appointments(
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    date: str | None = Query(default=None),
):
    stmt = (
        select(Appointment, Client.name, Service.name, Employee.name)
        .join(Client, Client.id == Appointment.client_id)
        .join(Service, Service.id == Appointment.service_id)
        .join(Employee, Employee.id == Appointment.employee_id)
        .where(Appointment.tenant_id == tenant_id)
        .order_by(Appointment.start_at.asc())
    )

    rows = db.execute(stmt).all()
    outs = [_to_out(a, c, s, e) for a, c, s, e in rows]
    if date:
        outs = [o for o in outs if o.date == date]
    return outs


@router.post("", response_model=AppointmentOut)
def create_appointment(
    payload: AppointmentCreate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    client = db.scalar(select(Client).where(and_(Client.id == payload.client_id, Client.tenant_id == tenant_id)))
    service = db.scalar(select(Service).where(and_(Service.id == payload.service_id, Service.tenant_id == tenant_id)))
    employee = db.scalar(select(Employee).where(and_(Employee.id == payload.employee_id, Employee.tenant_id == tenant_id)))
    if not client or not service or not employee:
        raise HTTPException(status_code=400, detail="Relacionamentos inválidos")

    appointment = Appointment(tenant_id=tenant_id, **payload.model_dump())
    db.add(appointment)

    client.total_visits += 1
    client.last_visit = payload.start_at.date()
    log_tenant_action(
        db,
        tenant_id,
        current_user.full_name,
        "Agenda",
        "create",
        "Criou agendamento",
        f"{client.name} - {service.name}",
    )

    db.commit()
    db.refresh(appointment)
    invalidate_tenant_caches(tenant_id)
    return _to_out(appointment, client.name, service.name, employee.name)


@router.put("/{appointment_id}", response_model=AppointmentOut)
def update_appointment(
    appointment_id: str,
    payload: AppointmentUpdate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    appointment = db.scalar(select(Appointment).where(and_(Appointment.id == appointment_id, Appointment.tenant_id == tenant_id)))
    if not appointment:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")

    client = db.scalar(select(Client).where(and_(Client.id == payload.client_id, Client.tenant_id == tenant_id)))
    service = db.scalar(select(Service).where(and_(Service.id == payload.service_id, Service.tenant_id == tenant_id)))
    employee = db.scalar(select(Employee).where(and_(Employee.id == payload.employee_id, Employee.tenant_id == tenant_id)))
    if not client or not service or not employee:
        raise HTTPException(status_code=400, detail="Relacionamentos inválidos")

    for field, value in payload.model_dump().items():
        setattr(appointment, field, value)
    log_tenant_action(
        db,
        tenant_id,
        current_user.full_name,
        "Agenda",
        "update",
        "Atualizou agendamento",
        f"{client.name} - {service.name}",
    )
    db.commit()
    db.refresh(appointment)
    invalidate_tenant_caches(tenant_id)

    return _to_out(appointment, client.name, service.name, employee.name)


@router.delete("/{appointment_id}")
def delete_appointment(
    appointment_id: str,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    appointment = db.scalar(select(Appointment).where(and_(Appointment.id == appointment_id, Appointment.tenant_id == tenant_id)))
    if not appointment:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    log_tenant_action(db, tenant_id, current_user.full_name, "Agenda", "delete", "Removeu agendamento", appointment.id)
    db.delete(appointment)
    db.commit()
    invalidate_tenant_caches(tenant_id)
    return {"message": "Agendamento removido"}


@router.post("/{appointment_id}/finalize", response_model=AppointmentOut)
def finalize_appointment(
    appointment_id: str,
    payload: FinalizeAppointmentPayload,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    row = db.execute(
        select(Appointment, Client, Service, Employee)
        .join(Client, Client.id == Appointment.client_id)
        .join(Service, Service.id == Appointment.service_id)
        .join(Employee, Employee.id == Appointment.employee_id)
        .where(and_(Appointment.id == appointment_id, Appointment.tenant_id == tenant_id))
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")

    appointment, client, service, employee = row
    if appointment.status == "completed":
        return _to_out(appointment, client.name, service.name, employee.name)

    paid_value = appointment.price if payload.paid_value is None else max(0, payload.paid_value)
    appointment.status = "completed"
    if payload.payment_method == "Fiado" or paid_value < appointment.price:
        paid = min(paid_value, appointment.price)
        db.add(
            Receivable(
                tenant_id=tenant_id,
                appointment_id=appointment.id,
                client=client.name,
                description=f"{service.name} - {appointment.start_at.strftime('%d/%m/%Y')}",
                total=appointment.price,
                paid=paid,
                status="partial" if paid else "open",
                due_date=payload.due_date,
            )
        )
        if paid:
            db.add(CashMovement(tenant_id=tenant_id, description=f"Pagamento parcial - {client.name}", type="entrada", method=payload.payment_method, value=paid))
    else:
        db.add(CashMovement(tenant_id=tenant_id, description=f"Atendimento - {client.name}", type="entrada", method=payload.payment_method, value=appointment.price))

    commission_value = int(appointment.price * (employee.commission / 100.0))
    if commission_value:
        db.add(
            CommissionRecord(
                tenant_id=tenant_id,
                appointment_id=appointment.id,
                employee_id=employee.id,
                employee_name=employee.name,
                service=service.name,
                price=appointment.price,
                rate=employee.commission,
                value=commission_value,
            )
        )

    usage_rows = db.execute(
        select(ServiceProductUsage).where(and_(ServiceProductUsage.tenant_id == tenant_id, ServiceProductUsage.service_id == service.id))
    ).scalars().all()
    for usage in usage_rows:
        product = db.scalar(select(Product).where(and_(Product.id == usage.product_id, Product.tenant_id == tenant_id)))
        if not product:
            continue
        product.stock = max(0, product.stock - usage.qty)
        db.add(
            StockMovement(
                tenant_id=tenant_id,
                product_id=product.id,
                product_name=product.name,
                qty=usage.qty,
                type="consume",
                appointment_id=appointment.id,
                reason=f"Consumo em {service.name}",
            )
        )

    log_tenant_action(db, tenant_id, current_user.full_name, "Agenda", "update", "Finalizou atendimento", f"{client.name} - {service.name}")
    db.commit()
    db.refresh(appointment)
    invalidate_tenant_caches(tenant_id)
    return _to_out(appointment, client.name, service.name, employee.name)
