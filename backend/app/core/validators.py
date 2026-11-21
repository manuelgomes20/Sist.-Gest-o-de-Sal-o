import re

from fastapi import HTTPException

PHONE_RE = re.compile(r"^(?:\+?244)?\s?9\d{2}\s?\d{3}\s?\d{3}$")
NIF_RE = re.compile(r"^[0-9A-Za-z]{9,15}$")


def normalize_phone(value: str) -> str:
    phone = (value or "").strip()
    if not PHONE_RE.match(phone):
        raise ValueError("Telefone inválido. Use formato angolano, ex.: +244 923 456 789")
    digits = re.sub(r"\D", "", phone)
    if digits.startswith("244"):
        digits = digits[3:]
    return f"+244 {digits[:3]} {digits[3:6]} {digits[6:]}"


def validate_nif(value: str) -> str:
    nif = (value or "").strip().upper()
    if not NIF_RE.match(nif):
        raise ValueError("NIF inválido. Use 9 a 15 caracteres alfanuméricos")
    return nif


def validate_password_strength(value: str) -> str:
    password = value or ""
    if len(password) < 8:
        raise ValueError("Senha deve ter pelo menos 8 caracteres")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Senha deve conter pelo menos uma letra maiúscula")
    if not re.search(r"[a-z]", password):
        raise ValueError("Senha deve conter pelo menos uma letra minúscula")
    if not re.search(r"\d", password):
        raise ValueError("Senha deve conter pelo menos um número")
    if not re.search(r"[^A-Za-z0-9]", password):
        raise ValueError("Senha deve conter pelo menos um símbolo")
    return password


def http_400_from_value_error(exc: ValueError) -> HTTPException:
    return HTTPException(status_code=400, detail=str(exc))
