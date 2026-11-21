import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    employee_id: Mapped[str] = mapped_column(String(36), ForeignKey("employees.id"), index=True)
    employee_name: Mapped[str] = mapped_column(String(120), default="")
    date: Mapped[str] = mapped_column(String(10), index=True)
    check_in: Mapped[str] = mapped_column(String(5), default="")
    check_out: Mapped[str] = mapped_column(String(5), default="")
    expected_in: Mapped[str] = mapped_column(String(5), default="08:00")
    late_minutes: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="present")
    note: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Receivable(Base):
    __tablename__ = "receivables"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    appointment_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("appointments.id"), nullable=True, index=True)
    client: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(String(180))
    total: Mapped[int] = mapped_column(Integer, default=0)
    paid: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="open")
    due_date: Mapped[str] = mapped_column(String(10), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ReceivablePayment(Base):
    __tablename__ = "receivable_payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    receivable_id: Mapped[str] = mapped_column(String(36), ForeignKey("receivables.id"), index=True)
    value: Mapped[int] = mapped_column(Integer, default=0)
    method: Mapped[str] = mapped_column(String(40), default="Dinheiro")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id"), index=True)
    product_name: Mapped[str] = mapped_column(String(120), default="")
    qty: Mapped[int] = mapped_column(Integer, default=0)
    type: Mapped[str] = mapped_column(String(20), default="consume")
    appointment_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("appointments.id"), nullable=True)
    reason: Mapped[str] = mapped_column(String(180), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ServiceProductUsage(Base):
    __tablename__ = "service_product_usage"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    service_id: Mapped[str] = mapped_column(String(36), ForeignKey("services.id"), index=True)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id"), index=True)
    qty: Mapped[int] = mapped_column(Integer, default=1)


class CommissionRecord(Base):
    __tablename__ = "commission_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    appointment_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("appointments.id"), nullable=True, index=True)
    employee_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("employees.id"), nullable=True, index=True)
    employee_name: Mapped[str] = mapped_column(String(120), default="")
    service: Mapped[str] = mapped_column(String(120), default="")
    price: Mapped[int] = mapped_column(Integer, default=0)
    rate: Mapped[int] = mapped_column(Integer, default=0)
    value: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PayrollAdvance(Base):
    __tablename__ = "payroll_advances"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    employee_id: Mapped[str] = mapped_column(String(36), ForeignKey("employees.id"), index=True)
    employee_name: Mapped[str] = mapped_column(String(120), default="")
    value: Mapped[int] = mapped_column(Integer, default=0)
    reason: Mapped[str] = mapped_column(String(180), default="")
    status: Mapped[str] = mapped_column(String(20), default="pending")
    payroll_run_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    date: Mapped[str] = mapped_column(String(10), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PayrollDeduction(Base):
    __tablename__ = "payroll_deductions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    employee_id: Mapped[str] = mapped_column(String(36), ForeignKey("employees.id"), index=True)
    employee_name: Mapped[str] = mapped_column(String(120), default="")
    month: Mapped[str] = mapped_column(String(7), index=True)
    label: Mapped[str] = mapped_column(String(120))
    value: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PayrollRun(Base):
    __tablename__ = "payroll_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    employee_id: Mapped[str] = mapped_column(String(36), ForeignKey("employees.id"), index=True)
    employee_name: Mapped[str] = mapped_column(String(120), default="")
    month: Mapped[str] = mapped_column(String(7), index=True)
    gross: Mapped[int] = mapped_column(Integer, default=0)
    total_deductions: Mapped[int] = mapped_column(Integer, default=0)
    net: Mapped[int] = mapped_column(Integer, default=0)
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    paid_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AlertRecord(Base):
    __tablename__ = "alert_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    title: Mapped[str] = mapped_column(String(160))
    message: Mapped[str] = mapped_column(Text, default="")
    severity: Mapped[str] = mapped_column(String(20), default="info")
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class LegalDocument(Base):
    __tablename__ = "legal_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    type: Mapped[str] = mapped_column(String(40), index=True)
    title: Mapped[str] = mapped_column(String(160))
    version: Mapped[str] = mapped_column(String(30), default="1.0")
    content: Mapped[str] = mapped_column(Text, default="")
    published: Mapped[bool] = mapped_column(Boolean, default=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class LegalAcceptance(Base):
    __tablename__ = "legal_acceptances"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("tenants.id"), nullable=True, index=True)
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    document_type: Mapped[str] = mapped_column(String(40), index=True)
    version: Mapped[str] = mapped_column(String(30), default="")
    ip: Mapped[str] = mapped_column(String(80), default="")
    accepted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PlatformSettings(Base):
    __tablename__ = "platform_settings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    key: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    value: Mapped[dict] = mapped_column(JSON, default=dict)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class TenantEvent(Base):
    __tablename__ = "tenant_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    type: Mapped[str] = mapped_column(String(40))
    by: Mapped[str] = mapped_column(String(120), default="Sistema")
    note: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
