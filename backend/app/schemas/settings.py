from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.validators import normalize_phone, validate_nif


class CompanySettings(BaseModel):
    name: str
    nif: str
    phone: str
    email: EmailStr
    address: str
    city: str
    logo: str = ""

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return normalize_phone(value)

    @field_validator("nif")
    @classmethod
    def validate_company_nif(cls, value: str) -> str:
        return validate_nif(value)


class BusinessHours(BaseModel):
    open: str = ""
    close: str = ""


class TenantSettingsOut(BaseModel):
    company: CompanySettings
    hours: BusinessHours
    roles: dict[str, dict[str, bool]]
    schedule: dict = Field(default_factory=dict)


class TenantSettingsUpdate(BaseModel):
    company: CompanySettings
    hours: BusinessHours
    roles: dict[str, dict[str, bool]]
    schedule: dict = Field(default_factory=dict)


class SupportRequestCreate(BaseModel):
    subject: str
    message: str
    priority: str = "normal"
