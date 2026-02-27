# Workflow de Desenvolvimento

Processo formal para organizar o ciclo completo de desenvolvimento no CreatorConnect.

---

## 1. Task Lifecycle

Toda task segue 5 estados:

```
pendente → planejada → em-progresso → revisao → concluida
```

| Estado         | Significado                          | Gate de saida                   |
| -------------- | ------------------------------------ | ------------------------------- |
| `pendente`     | Identificada, sem escopo definido    | Checklist + arquivos definidos  |
| `planejada`    | Escopo claro, pronta pra comecar     | —                               |
| `em-progresso` | Sendo implementada                   | Todos itens do checklist feitos |
| `revisao`      | Codigo pronto, verificando qualidade | Gates passam + commit feito     |
| `concluida`    | Commitada e verificada               | —                               |

**Regras**:

- Nao pular estados (exceto `pendente → em-progresso` para tasks triviais)
- Uma task so vai para `concluida` quando TODOS os gates passam
- Se um gate falha em `revisao`, volta para `em-progresso`

---

## 2. Orquestracao de Agents

### Por tipo de tarefa

**Feature nova**:

1. `feature-architect` — plano de implementacao
2. `db-architect` — se precisa de schema changes
3. `api-builder` — endpoints backend
4. `frontend-component` — UI/componentes
5. `test-writer` — testes automatizados
6. `code-reviewer` — revisao de qualidade
7. `docs-writer` — documentacao (se necessario)

**Bug fix**:

1. `bug-fixer` — diagnostico e correcao
2. `test-writer` — teste de regressao
3. `code-reviewer` — opcional

**Refactor**:

1. `code-refactor` — reestruturacao
2. `code-reviewer` — validacao
3. `test-writer` — se gap de cobertura

**UI-only**:

1. `ui-ux-architect` — se complexo/design decision
2. `frontend-component` — implementacao
3. `code-reviewer` — revisao

**Instagram/TikTok**:

1. `feature-architect` — plano
2. `instagram-integration` ou `tiktok-integration` — implementacao
3. `test-writer` — testes
4. `code-reviewer` — revisao

### Regras de execucao

- **Planning agents sao sequenciais** — architect primeiro, depois implementation
- **Implementation agents podem rodar em paralelo** — se arquivos sao independentes (ex: backend + frontend simultaneo)
- **Quality agents sao sequenciais** — test-writer antes de code-reviewer
- **docs-writer e sempre o ultimo** — so roda apos code-reviewer aprovar

---

## 3. Protocolo de Commit

### Formato

```
[TASK-NNN] Descricao curta em ingles

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

Se nao ha task associada, usar formato livre mas sempre com Co-Authored-By.

### Pre-commit checklist

1. `npm run check` passa (0 erros TypeScript)
2. `npm run test` passa (todos testes verdes)
3. Sem secrets/env files staged (`git diff --cached --name-only` nao lista `.env*`)
4. Task file atualizado (checklist marcado, gates verificados)
5. Mensagem de commit referencia `TASK-NNN`

### Pos-commit

1. Task file → status `concluida`, campo `Commit` preenchido com hash + mensagem
2. CLAUDE.md atualizado se numeros mudaram (tabelas, endpoints, testes, etc.)

---

## 4. Protocolo de Sessao

### Inicio de sessao

1. Ler task file ativa em `docs/tasks/`
2. `git status` + `git diff --stat` — entender estado atual
3. `npm run check` + `npm run test` — verificar saude do codebase
4. Retomar de onde o **Log de Progresso** parou na task file

### Fim de sessao

1. Atualizar task file:
   - Checklist items concluidos marcados
   - Log de Progresso com entrada datada descrevendo o que foi feito
2. Atualizar MEMORY.md se algo relevante aconteceu (erro novo, pattern aprendido, decisao importante)
3. Deletar plan files de `.claude/plans/` se plano ja foi transferido para task file

---

## 5. Plan Mode

O Plan Mode do Claude Code cria arquivos temporarios em `.claude/plans/`.

**Fluxo**:

1. Claude entra em plan mode e cria arquivo de plano
2. Usuario aprova o plano
3. Conteudo relevante do plano e transferido para `docs/tasks/TASK-NNN.md`
4. Plan file em `.claude/plans/` e deletado
5. Task file passa para status `planejada`

**Regras**:

- Plan files NAO sao permanentes — sao rascunhos temporarios
- A fonte de verdade e sempre o task file em `docs/tasks/`
- Se uma sessao termina com plan file pendente, a proxima sessao deve transferir e deletar

---

## 6. Sprint Review

Ao finalizar uma sprint, criar `docs/tasks/SPRINT-SXX-REVIEW.md` com:

### Estrutura

```markdown
# Sprint SXX Review

## Resumo

Objetivos da sprint e resultado geral.

## Metricas

| Metrica   | Antes | Depois |
| --------- | ----- | ------ |
| Testes    | N     | M      |
| Endpoints | N     | M      |
| Erros TS  | N     | M      |

## Tasks Concluidas

- TASK-NNN: descricao — resultado
- TASK-NNN: descricao — resultado

## Licoes Aprendidas

- O que funcionou bem
- O que causou retrabalho
- O que mudar na proxima sprint

## Updates de Memory

- O que foi registrado em MEMORY.md
- Patterns novos documentados

## Pendencias para Proxima Sprint

- Items nao concluidos
- Debitos tecnicos identificados
```

---

## Referencia Rapida

| Preciso de...         | Faco...                                                     |
| --------------------- | ----------------------------------------------------------- |
| Criar uma task        | Copiar `docs/tasks/_TEMPLATE.md` → `docs/tasks/TASK-NNN.md` |
| Planejar uma feature  | Plan mode → transferir para task file → deletar plan        |
| Comecar a implementar | Task → `em-progresso`, seguir orquestracao de agents        |
| Commitar              | Pre-commit checklist → commit → pos-commit                  |
| Iniciar sessao        | Ler task ativa, git status, check, test, retomar log        |
| Finalizar sprint      | Criar `SPRINT-SXX-REVIEW.md`                                |
