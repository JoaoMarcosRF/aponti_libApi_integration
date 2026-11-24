# Suíte de Testes de API com Playwright — Biblioteca API

Este repositório contém o projeto de automação de testes de API desenvolvido com **Playwright (`APIRequestContext`)** e **TypeScript**, aplicando o padrão **POM (Page/API Object Model)** e organização modular por domínio.

---

## Arquitetura dos Testes e POM

Os testes estão organizados dentro do diretório `tests/`, separando a camada de abstração das chamadas HTTP (**POM**) dos arquivos de especificação de cenários por módulo:

```text
tests/
├── pom/
│   ├── AuthPage.ts          # Encapsula endpoints de autenticação (/api/auth)
│   ├── LivrosPage.ts        # Encapsula endpoints de livros (/api/livros)
│   └── EmprestimosPage.ts   # Encapsula endpoints de empréstimos (/api/emprestimos)
├── auth.spec.ts             # Cenários de teste do módulo de Autenticação
├── livros.spec.ts           # Cenários de teste do módulo de Livros
└── emprestimos.spec.ts      # Cenários de teste do módulo de Empréstimos
```

### Por que POM em Testes de API?
- **Reuso e Manutenibilidade:** Rotas, cabeçalhos (`Authorization: Bearer <token>`) e payloads ficam centralizados nas classes `AuthPage`, `LivrosPage` e `EmprestimosPage`.
- **Legibilidade:** Os arquivos `.spec.ts` focam exclusivamente na regra de negócio, no fluxo do cenário e nas asserções de **status code** e **corpo da resposta**.
- **Isolamento (Teardown):** Recursos criados durante os testes são removidos ao final da execução para manter o banco em memória íntegro.

---

## Cenários Automatizados

Em **todos** os cenários são validados o **HTTP Status Code** e **pelo menos um campo do corpo da resposta (JSON)**.

### 1. Módulo de Livros (`tests/livros.spec.ts`)
- **Consulta do livro `id = 1`:** Envia `GET /api/livros/1` e valida status `200`, `titulo: "Dom Casmurro"` e `disponivel: true`.
- **Cadastro de novo livro como Admin + Teardown:** Autentica como administrador, envia `POST /api/livros` com o token e valida status `201`, retorno do `id` gerado e correspondência com todos os dados enviados. Ao final, exclui o livro com `DELETE /api/livros/:id` (`204`) e valida `404` (`"Livro não encontrado"`) ao consultá-lo novamente.
- **Tentativa de cadastro sem token:** Envia `POST /api/livros` sem cabeçalho de autorização e valida status `401` e `erro: "Token não informado"`.
- **[Extra] Tentativa de cadastro com perfil Leitor:** Envia `POST /api/livros` com token de leitor e valida recusa com status `403` e mensagem `"Acesso negado..."`.
- **[Extra] Filtro de livros por autor:** Envia `GET /api/livros?autor=machado` e valida status `200` contendo apenas obras de `"Machado de Assis"`.
- **[Extra] Conflito de ISBN duplicado:** Tenta cadastrar livro com ISBN já existente (`9788500000011`) e valida status `409` com `erro: "ISBN já cadastrado"`.

### 2. Módulo de Empréstimos (`tests/emprestimos.spec.ts`)
- **Empréstimo de livro indisponível ("Vidas Secas", `id = 4`):** Autentica usuário e envia `POST /api/emprestimos` para o livro de `id = 4` (estoque `0`), validando status `409` e `erro: "Livro indisponível"`.
- **[Extra] Ciclo completo de empréstimo, devolução e teardown:** Realiza empréstimo do livro `id = 1` (`201` + `status: "ativo"`), confirma redução de `quantidadeDisponivel`, registra a devolução via `PATCH /api/emprestimos/:id/devolucao` (`200` + `status: "devolvido"`) e exclui o registro no teardown (`204`).

### 3. Módulo de Autenticação (`tests/auth.spec.ts`)
- **[Extra] Login de administrador com sucesso:** Envia `POST /api/auth/login` e valida status `200`, presença de `token`, `tipo: "Bearer"` e perfil `"admin"`.
- **[Extra] Login com senha inválida:** Envia `POST /api/auth/login` com senha incorreta e valida status `401` e `erro: "E-mail ou senha inválidos"`.

---

## Como Executar

### 1. Instalar as dependências
```bash
npm install
```

### 2. Rodar todos os testes
O Playwright está configurado (`playwright.config.ts`) para iniciar automaticamente o servidor da API em `http://localhost:3000` antes de executar a suíte:
```bash
npm test
```

### 3. Rodar testes de um módulo específico
```bash
npx playwright test tests/livros.spec.ts
npx playwright test tests/emprestimos.spec.ts
npx playwright test tests/auth.spec.ts
```
