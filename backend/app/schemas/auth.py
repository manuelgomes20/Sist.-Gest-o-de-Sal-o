from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.validators import normalize_phone, validate_nif, validate_password_strength


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class RegisterTenantRequest(BaseModel):
    company_name: str
    company_email: EmailStr
    company_phone: str
    company_nif: str
    company_address: str = ""
    company_city: str = "Luanda"
    company_logo: str = ""

    admin_name: str
    admin_email: EmailStr
    admin_phone: str
    admin_password: str = Field(min_length=8)

    @field_validator("company_phone", "admin_phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return normalize_phone(value)

    @field_validator("company_nif")
    @classmethod
    def validate_company_nif(cls, value: str) -> str:
        return validate_nif(value)

    @field_validator("admin_password")
    @classmethod
    def validate_admin_password(cls, value: str) -> str:
        return validate_password_strength(value)


class UserMe(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    phone: str = ""
    role: str
    tenant_id: str | None = None
    permissions: dict[str, bool] = {}
    tenant: dict | None = None
