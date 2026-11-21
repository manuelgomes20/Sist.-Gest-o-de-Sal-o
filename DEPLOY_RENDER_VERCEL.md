# Deploy: Render (API + dados) e Vercel (frontend)

## Antes do primeiro deploy

1. Envie o repositório para GitHub ou GitLab.
2. Confirme que `backend/.env` não foi enviado. Esse arquivo contém credenciais locais e está no `.gitignore`.
3. Decida o nome/domínio de produção do frontend. A origem, por exemplo `https://genomni-salon.vercel.app`, será usada na configuração CORS do backend.

## 1. Crie o projeto frontend na Vercel

1. Importe o repositório na Vercel.
2. Em **Root Directory**, selecione `frontend`.
3. Use Vite, build `npm run build` e diretório de saída `dist`.
4. Em **Environment Variables**, crie para **Production**:

   ```text
   VITE_API_BASE_URL=https://example.invalid/api/v1
   ```

   Esse valor temporário só permite fazer o primeiro build e descobrir/reservar o domínio Vercel. O frontend não precisa chamar a API durante a compilação.

5. Faça o primeiro deploy e copie a origem de produção mostrada pela Vercel, sem barra final. Exemplo: `https://genomni-salon.vercel.app`.

O projeto já tem `frontend/vercel.json` com rewrite para as rotas do React Router. A Vercel requer esse rewrite para abrir diretamente páginas internas da SPA. [Documentação Vercel/Vite](https://vercel.com/docs/frameworks/frontend/vite)

## 2. Prepare e publique a API no Render

1. No Render, escolha **New → Blueprint** e selecione o mesmo repositório. O arquivo `render.yaml` está na raiz.
2. **Antes de sincronizar**, edite os planos `free` do Blueprint para planos pagos, se a aplicação vai guardar dados reais. Os IDs de plano atuais documentados pelo Render são:

   - API web: `0.5c-512mb` (ou um plano maior, conforme o tráfego).
   - PostgreSQL: `0.1c-256mb` (ou um plano maior se os dados/uso exigirem).
   - Key Value: `256mb`; ele é cache e pode ser omitido se não quiser Redis.

   Confirme os preços e tamanhos no Dashboard do Render antes de sincronizar. O Blueprint deste repositório ainda marca esses três recursos como `free`; sincronizá-lo sem alterar isso cria recursos de avaliação. O PostgreSQL gratuito expira após 30 dias e não tem backups; o web service gratuito hiberna após inatividade, e o Key Value gratuito não persiste dados. Esses planos não servem para dados de produção. [Limitações do Render Free](https://render.com/docs/free) · [Planos do Blueprint](https://render.com/docs/blueprint-spec)

3. Na primeira sincronização do Blueprint, preencha os campos solicitados:

   - `CORS_ORIGINS`: origem Vercel copiada acima, por exemplo `https://genomni-salon.vercel.app`. Se também usar domínio próprio, inclua as duas origens separadas por vírgula, sem barras finais.
   - `SUPER_ADMIN_EMAIL`: email que você quer usar para o superadmin de produção.
   - `SUPER_ADMIN_PASSWORD`: senha forte com pelo menos 12 caracteres.

   `SECRET_KEY` é gerada pelo Render; `DATABASE_URL` e `REDIS_URL` são ligadas aos serviços do próprio Blueprint. As variáveis `sync: false` são pedidas durante a primeira criação do Blueprint; em sincronizações futuras, ajuste-as em **Environment** no serviço. [Blueprint e variáveis secretas](https://render.com/docs/blueprint-spec)

4. Sincronize o Blueprint e acompanhe o deploy de `genomni-salon-api`.
5. Copie a URL pública real do backend e confirme que `https://SUA-API.onrender.com/health` responde `{"status":"ok", ...}`.

## 3. Aponte a Vercel para a API real

1. Na Vercel, abra **Project → Settings → Environment Variables**.
2. Troque `VITE_API_BASE_URL` pela URL real copiada do Render, acrescentando `/api/v1`:

   ```text
   VITE_API_BASE_URL=https://SUA-API.onrender.com/api/v1
   ```

3. Salve e faça um novo deploy de produção. Variáveis `VITE_*` são incorporadas durante o build, então salvar sem redeploy não atualiza o frontend. [Variáveis Vercel](https://vercel.com/docs/environment-variables/managing-environment-variables)

## Superadmin: criação e troca de senha

No primeiro arranque, o backend cria o superadmin usando `SUPER_ADMIN_EMAIL` e `SUPER_ADMIN_PASSWORD`. Portanto, escolha as credenciais de produção durante a primeira configuração do Render; as credenciais locais em `backend/.env` não são enviadas nem reutilizadas na Vercel/Render.

O seed de inicialização **não troca a senha de uma conta já existente**. Para trocar senha ou promover outro email depois do primeiro deploy:

1. Atualize `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD` e, se necessário, `SUPER_ADMIN_NAME` no serviço do Render.
2. Abra o **Shell** do serviço web pago e, no diretório do backend, execute:

   ```bash
   python -m app.cli create-super-admin \
     --email "$SUPER_ADMIN_EMAIL" \
     --password "$SUPER_ADMIN_PASSWORD" \
     --name "$SUPER_ADMIN_NAME"
   ```

   O comando cria ou atualiza a conta com esse email. Se mudar o email, a conta antiga continua existindo até você desativá-la/removê-la pela gestão de usuários; confirme qual conta manter antes de fazer essa limpeza. O Render não oferece Shell para web services gratuitos. [Shell do Render](https://render.com/docs/ssh)

## Verificação final

- `https://SUA-API.onrender.com/health` → API e banco respondem.
- `https://SEU-FRONTEND.vercel.app/` → landing.
- `/login`, `/register` e uma rota interna como `/dashboard` abrem diretamente.
- Entre com o superadmin de produção e confirme `/super-admin`.
- Cadastre um tenant de teste e confirme que seus dados aparecem após sair e entrar novamente.

Antes de inserir dados reais, confirme que o PostgreSQL está num plano pago com backups e que `CORS_ORIGINS` contém somente os domínios frontend usados.
