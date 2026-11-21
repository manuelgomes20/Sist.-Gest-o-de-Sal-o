from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_super_admin
from app.db.session import get_db
from app.models.operations import LegalAcceptance, LegalDocument, PlatformSettings
from app.models.user import User

router = APIRouter()


class SettingPayload(BaseModel):
    value: dict


class LegalDocumentPayload(BaseModel):
    type: str
    title: str
    version: str = "1.0"
    content: str
    published: bool = True


def _setting(db: Session, key: str) -> PlatformSettings:
    row = db.scalar(select(PlatformSettings).where(PlatformSettings.key == key))
    if row:
        return row
    row = PlatformSettings(key=key, value={})
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/settings/{key}")
def get_setting(key: str, db: Session = Depends(get_db)):
    return _setting(db, key).value


@router.put("/settings/{key}", dependencies=[Depends(require_super_admin)])
def update_setting(key: str, payload: SettingPayload, db: Session = Depends(get_db)):
    row = _setting(db, key)
    row.value = payload.value
    row.updated_at = datetime.utcnow()
    db.commit()
    return row.value


@router.get("/legal/{document_type}")
def public_legal_document(document_type: str, db: Session = Depends(get_db)):
    row = db.scalar(
        select(LegalDocument)
        .where(LegalDocument.type == document_type, LegalDocument.published.is_(True))
        .order_by(LegalDocument.updated_at.desc())
    )
    if not row:
        return {"type": document_type, "title": document_type.title(), "version": "1.0", "content": ""}
    return {"id": row.id, "type": row.type, "title": row.title, "version": row.version, "content": row.content, "updatedAt": row.updated_at.isoformat()}


@router.get("/legal", dependencies=[Depends(require_super_admin)])
def list_legal_documents(db: Session = Depends(get_db)):
    rows = db.execute(select(LegalDocument).order_by(LegalDocument.updated_at.desc())).scalars().all()
    return [
        {"id": row.id, "type": row.type, "title": row.title, "version": row.version, "content": row.content, "published": row.published}
        for row in rows
    ]


@router.post("/legal", dependencies=[Depends(require_super_admin)])
def save_legal_document(payload: LegalDocumentPayload, db: Session = Depends(get_db)):
    row = db.scalar(select(LegalDocument).where(LegalDocument.type == payload.type, LegalDocument.version == payload.version))
    if not row:
        row = LegalDocument(type=payload.type)
        db.add(row)
    row.title = payload.title
    row.version = payload.version
    row.content = payload.content
    row.published = payload.published
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return {"id": row.id}


@router.post("/legal/{document_type}/accept")
def accept_legal_document(
    document_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = db.scalar(
        select(LegalDocument)
        .where(LegalDocument.type == document_type, LegalDocument.published.is_(True))
        .order_by(LegalDocument.updated_at.desc())
    )
    if not document:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    row = LegalAcceptance(
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        document_type=document.type,
        version=document.version,
    )
    db.add(row)
    db.commit()
    return {"message": "Documento aceite"}
