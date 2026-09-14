# JEGDS 2026 🏆 - Jogos Escolares de Gonçalves Dias

> Sistema Web Oficial de Inscrições, Credenciamento e Súmulas para os **Jogos Escolares de Gonçalves Dias 2026 (JEGDS 2026)**, realizado entre **21/11/2026 e 19/12/2026** em Gonçalves Dias, Maranhão, Brasil.

---

## 📋 Regras Oficiais do Evento

### 1. Categorias por Idade (Data de Referência: 31/12/2026)
- **Mirim**: 9 a 11 anos (nascidos de 01/01/2015 a 31/12/2017)
- **Infantil**: 12 a 14 anos (nascidos de 01/01/2012 a 31/12/2014)
- **Infanto**: 15 a 17 anos (nascidos de 01/01/2009 a 31/12/2011)
- **Junior**: 18 a 20 anos (nascidos de 01/01/2006 a 31/12/2008)

### 2. Matriz Estrita Modalidade × Categoria × Sexo

| Modalidade | Mirim | Infantil | Infanto | Junior | Regras e Limites |
|---|---|---|---|---|---|
| **Atletismo** | FEM / MASC | FEM / MASC | FEM / MASC | FEM / MASC | Máx 2 provas por atleta (Mirim: 75m, 100m; Infantil: 75m, 100m, 200m, salto; Infanto/Junior: 100m, 200m, 400m, 1000m, salto) |
| **Xadrez** | FEM / MASC | FEM / MASC | FEM / MASC | FEM / MASC | Sistema Suíço (máx 4 atletas por escola) |
| **Futsal** | FEM / MASC | FEM / MASC | FEM / MASC | FEM / MASC | Máximo 10 atletas inscritos por equipe |
| **Queimada** | FEM / MASC | FEM / MASC | FEM / MASC | FEM / MASC | Mínimo 8 atletas inscritos por equipe |
| **Futebol de Campo** | Apenas MASC | Apenas MASC | Apenas MASC | Apenas MASC | Máximo 20 atletas no elenco |
| **Voleibol** | ❌ Não existe | Apenas MASC | Apenas MASC | Apenas MASC | Exclusivo Masculino (máx 12 atletas) |
| **Beach Soccer** | ❌ Não existe | Apenas MASC | Apenas MASC | Apenas MASC | Exclusivo Masculino na areia (máx 12 atletas) |
| **Tênis de Mesa** | ❌ Não existe | Apenas MASC | Apenas MASC | Apenas MASC | Exclusivo Masculino (máx 4 atletas) |

### 3. Prazos Oficiais e Datas dos Jogos

| Modalidade | Data do Evento | Prazo Limite de Inscrição |
|---|---|---|
| **Queimada, Tênis de Mesa** | 28/11/2026 | 21/11/2026 às 23:59 |
| **Atletismo, Beach Soccer** | 05/12/2026 | 28/11/2026 às 23:59 |
| **Futsal, Xadrez, Futebol de Campo, Voleibol** | 12/12/2026 | 05/12/2026 às 23:59 |

---

## 🚀 Funcionalidades

- **Portal da Escola**: Cadastro de estudantes-atletas (RG/Certidão obrigatório, foto 3x4 e termo LGPD de consentimento dos pais), seleção de provas e montagem de elenco com validação bloqueante no backend.
- **Painel do Comitê Organizador**:
  - Homologação e Rejeição com motivo formal.
  - Emissão de **Súmulas e Listas de Chamada Oficial** em PDF com horários de **Check-in (30 min de antecedência)** e **WxO (15 min de tolerância)**.
- **Crachá & Controle Logístico Oficial (`/validar`)**:
  - Geração de Crachás em PDF no padrão **CR80 (~85×54mm)** com cores oficiais de categoria (Mirim: Verde, Infantil: Teal, Infanto: Azul, Junior: Âmbar).
  - QR Code contendo **apenas o `cracha_token`** único para consulta dinâmica contra falsificações.
  - Impressão individual (pronta para laminação) e em lote com marcas de corte (8 por folha A4 ordenada por categoria e nome).
  - Painel de Operador com permissões por papel:
    - **Mesários / Árbitros**: Registro de Elegibilidade e Check-in de quadra.
    - **Equipe de Apoio / Logística**: Registro de entrega de kits de água, lanche e embarque no transporte (Ida / Volta).
    - **Coordenação SEMED**: Acesso total, histórico detalhado e remoção de registros.
  - **Relatório Logístico Agregado**: Acompanhamento em tempo real dos totais de água, lanches e transporte por escola, com contadores de pendências.

---

## 🧪 Testes Automatizados

O sistema possui uma suíte completa de testes unitários para regras de matriz e controle logístico:

```bash
# Executa todos os testes automatizados
npm test

# Executa apenas os testes de Crachá e Controle Logístico
npx tsx tests/cracha-controle.test.ts
```

---

## 🛠️ Deploy no Railway & Vercel

O projeto está 100% pronto para deploy no **Railway**:

1. No Railway Dashboard, crie um novo projeto a partir deste repositório GitHub (`semedJEGD/JEGDSISTEM`).
2. Adicione o plugin **PostgreSQL** no Railway.
3. A variável de ambiente `DATABASE_URL` será conectada automaticamente.
4. O Railway usará o `railway.json` / `nixpacks.toml` incluídos para compilar e iniciar o sistema.
5. Para rodar o seed com as 8 modalidades e escolas de Gonçalves Dias, execute no terminal do Railway:
   ```bash
   npx prisma db push
   npm run prisma:seed
   ```

---

## 💻 Execução Local

```bash
# 1. Instalar dependências
npm install

# 2. Executar suíte de testes de regras de negócio
npm test

# 3. Iniciar servidor local
npm run dev
```

Acesse no navegador: `http://localhost:3000`

---

Desenvolvido para os **Jogos Escolares de Gonçalves Dias 2026 (JEGDS 2026)** • SEMED Gonçalves Dias - MA.
