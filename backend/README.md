# GenOmni Salon Backend (FastAPI + PostgreSQL)

API completa para integração com o frontend do sistema de salão.

## Stack
- FastAPI
- SQLAlchemy 2
- PostgreSQL
- JWT (auth)

## Executar localmente
Na primeira execução, crie `backend/.env` a partir de `backend/.env.example` e substitua `SECRET_KEY`, `SUPER_ADMIN_EMAIL` e `SUPER_ADMIN_PASSWORD` por valores locais. O URL do banco e Redis no exemplo é para a rede Docker.

Na raiz do projeto, inicie a aplicação completa:

```bash
docker compose up --build
```

- Frontend: `http://localhost:8080`
- API: `http://localhost:8000`
- Documentação interativa da API: `http://localhost:8000/docs`

Para executar apenas os serviços de dados e o backend: `docker compose up --build backend db redis`.

## Health
- `GET /health`
- `GET /api/v1/auth/me` (com token)

## Conta de superadmin local

O superadmin é criado no primeiro arranque a partir de `SUPER_ADMIN_EMAIL` e `SUPER_ADMIN_PASSWORD`. Reiniciar o backend não redefine a senha de uma conta já existente. Para criar ou trocar a senha explicitamente, execute dentro do contentor backend:

```bash
docker compose exec backend python -m app.cli create-super-admin --email admin@seu-dominio.ao --password 'uma-senha-forte' --name 'Super Admin'
```

## Principais endpoints
- `POST /api/v1/auth/register-tenant`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

- `GET/POST/PUT/DELETE /api/v1/clients`
- `GET/POST/PUT/DELETE /api/v1/employees`
- `GET/POST/PUT/DELETE /api/v1/services`
- `GET/POST/PUT/DELETE /api/v1/products`
- `GET/POST/PUT/DELETE /api/v1/appointments`
- `GET /api/v1/dashboard/overview`
- `GET /api/v1/financial/summary`
- `GET /api/v1/financial/commissions`
- `GET/POST /api/v1/cashier/movements`
- `GET /api/v1/cashier/summary`

Super admin (token super admin):
- `GET /api/v1/super-admin/tenants`
- `PATCH /api/v1/super-admin/tenants/{tenant_id}/status`
- `GET /api/v1/super-admin/stats`
- `GET /api/v1/super-admin/logs`
- `GET /api/v1/super-admin/support/tickets`
- `POST /api/v1/super-admin/support/tickets/{tenant_id}`
- `PATCH /api/v1/super-admin/support/tickets/{ticket_id}`
- `POST /api/v1/super-admin/support/tickets/{ticket_id}/reply`
- `GET /api/v1/super-admin/support/tickets/{ticket_id}/replies`
