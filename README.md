# JEGDSISTEM 🏆 - Sistema Oficial de Inscrições dos Jogos Escolares

> Plataforma completa e moderna desenvolvida para a **SEMED (Secretaria Municipal de Educação)** gerenciar inscrições, credenciamento, emissão de crachás com QR Code e validação documental dos **Jogos Escolares (JEGD 2026)**.

---

## 🌟 Funcionalidades Principais

### 1. 🏫 Portal das Escolas (Gestão Escolar & Professores de Ed. Física)
- **Seleção e Cadastro de Escolas**: Suporte para Redes Municipal, Estadual, Particular e Federal.
- **Banco de Estudantes-Atletas**:
  - Cadastro detalhado com Foto 3x4 oficial.
  - Cálculo automático de idade e elegibilidade para as categorias **Infantil (12-14 anos)** e **Infanto (15-17 anos)**.
  - Registro de documentos (RG, CPF, Matrícula, Turma, Tipo Sanguíneo).
- **Comissão Técnica**: Registro de Professores e Técnicos com número de registro CREF.
- **Inscrição por Modalidade & Categoria**:
  - Filtro em tempo real de atletas aptos por idade e naipe (Masculino / Feminino / Misto).
  - Verificação de cotas mínimas e máximas de atletas por esporte.
  - Submissão com efeito de celebração e protocolo de envio.
- **Geração de Fichas e Crachás em PDF**:
  - Emissão de Ficha Oficial assinada em folha A4 com termos de responsabilidade.
  - Emissão de Crachás / Credenciais em lote com Foto e QR Code exclusivo.

### 2. 🏛️ Painel da Coordenação SEMED (Administrativo)
- **Métricas Consolidadas**: Total de escolas participantes, atletas inscritos, equipes por modalidade e status.
- **Julgamento e Homologação**: Deferimento, Indeferimento e Solicitação de Ajuste com parecer técnico oficial.
- **Emissão Oficial em Lote**: Impressão centralizada de credenciais e listas de atletas.
- **Mural de Comunicados**: Publicação de avisos urgentes e editais na capa do sistema.

### 3. 🔍 Validador de Credencial / QR Code
- Consulta instantânea para árbitros, fiscais de quadra e mesários verificarem a autenticidade e liberação do atleta antes do início das partidas.

---

## 🏅 Modalidades Contempladas

- **Coletivas**: Futsal, Voleibol, Handebol, Basquetebol, Queimada Escolar.
- **Individuais**: Atletismo, Xadrez, Tênis de Mesa, Badminton, Natação, Judô.

---

## 🚀 Tecnologias Utilizadas

- **Frontend & Backend**: [Next.js 15 (App Router)](https://nextjs.org/) com TypeScript
- **Estilização**: Tailwind CSS com tema Dark Mode de alta performance
- **Geração de Documentos**: [jsPDF](https://github.com/parallax/jsPDF) & [QRCode](https://github.com/soldair/node-qrcode)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Animações e Efeitos**: Canvas Confetti

---

## 📦 Como Executar o Projeto

```bash
# 1. Instalar as dependências
npm install

# 2. Iniciar o servidor de desenvolvimento
npm run dev

# 3. Acessar no navegador
http://localhost:3000
```

---

## 📄 Estrutura de Rotas

| Rota | Descrição |
|---|---|
| `/` | Landing page oficial do JEGD com estatísticas e avisos |
| `/escola/login` | Login e seleção de Unidades Escolares |
| `/escola/dashboard` | Painel da escola com resumo de inscrições e atletas |
| `/escola/atletas` | Gestão e cadastro do banco de alunos-atletas |
| `/escola/comissao` | Cadastro de técnicos e professores (CREF) |
| `/escola/inscricoes` | Montagem e submissão de equipes esportivas |
| `/admin/login` | Acesso restrito da Coordenação SEMED |
| `/admin/dashboard` | Julgamento de inscrições e emissor geral |
| `/modalidades` | Guia com regras e limites de atletas |
| `/regulamento` | Regulamento geral e critérios de idade |
| `/validar` | Validador de crachá e leitor de QR Code |

---

Desenvolvido para os **Jogos Escolares 2026 - SEMED**.
