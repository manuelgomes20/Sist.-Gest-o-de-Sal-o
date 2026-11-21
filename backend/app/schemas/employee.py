from pydantic import BaseModel, EmailStr, field_validator

from app.core.validators import normalize_phone, validate_password_strength


class EmployeeBase(BaseModel):
    name: str
    role: str
    type: str = "servico"
    phone: str = ""
    commission: int = 0
    salary: int = 0
    status: str = "active"
    email: EmailStr | None = None
    password: str | None = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return normalize_phone(value) if value else ""

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str | None) -> str | None:
        return validate_password_strength(value) if value else value


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(EmployeeBase):
    pass


class EmployeeOut(BaseModel):
    id: str
    name: str
    role: str
    type: str
    phone: str
    commission: int
    salary: int
    status: str
    email: str
