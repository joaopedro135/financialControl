# 📈 Controle FInanceiro

Sistema web de controle e visualização de investimentos pessoais.
Construído com HTML5, CSS3 semântico e JavaScript puro (vanilla) — sem frameworks.

---

## 📁 Estrutura do Projeto

```
/invest-dashboard
│
├── /assets
│   ├── /css
│   │   ├── global.css          → Sistema de design: variáveis, reset, componentes globais
│   │   ├── login.css           → Estilos exclusivos da tela de login
│   │   ├── register.css        → Estilos exclusivos da tela de registro
│   │   ├── dashboard.css       → Layout do dashboard: sidebar, topbar, cards, tabela
│   │   └── add-investment.css  → Formulário de novo investimento
│   │
│   ├── /js
│   │   ├── auth.js             → Autenticação (login, registro, logout, guarda de rota)
│   │   ├── dashboard.js        → Dados, gráfico, tabela e interações do dashboard
│   │   └── investment.js       → Formulário, validação e persistência de investimentos
│   │
│   └── /img
│       └── (ícones, logos e imagens estáticas)
│
├── login.html           → Tela de entrada do sistema
├── register.html        → Tela de criação de conta
├── dashboard.html       → Painel principal com resumo e histórico
├── add-investment.html  → Formulário de novo investimento
└── README.md
```

---

## 🖥️ Telas

| Arquivo               | Rota            | Descrição                              |
|-----------------------|-----------------|----------------------------------------|
| `login.html`          | `/login`        | Login com email e senha                |
| `register.html`       | `/register`     | Criação de conta                       |
| `dashboard.html`      | `/dashboard`    | Visão geral: cards, gráfico, histórico |
| `add-investment.html` | `/investimento` | Registro de novo investimento          |

---

## 🎨 Sistema de Design

O projeto usa um sistema de design baseado em **CSS Custom Properties (variáveis)** definidas em `global.css`.

### Tokens principais

| Token                    | Valor / Descrição              |
|--------------------------|--------------------------------|
| `--color-accent`         | `#3B6FF0` — Azul primário      |
| `--color-success`        | `#10B981` — Verde              |
| `--color-danger`         | `#EF4444` — Vermelho           |
| `--font-body`            | DM Sans (Google Fonts)         |
| `--font-mono`            | DM Mono (valores numéricos)    |
| `--radius-md`            | `10px`                         |
| `--shadow-md`            | Sombra suave de cards          |

---

## ⚙️ Onde implementar a lógica JavaScript

### `assets/js/auth.js`
- **Login:** captura de formulário → autenticação via API → armazenar token → redirecionar
- **Registro:** validação de campos → criação de conta → redirecionar
- **Logout:** limpar sessão → redirecionar para login
- **Guarda de rota:** checar token em todas as páginas protegidas

### `assets/js/dashboard.js`
- **Carregar dados:** buscar investimentos do usuário na API/banco
- **Cards de resumo:** calcular e exibir total investido, atual, lucro e %
- **Gráfico:** renderizar no elemento `#chart` com Chart.js ou ApexCharts
- **Filtros de período:** `[data-period]` — atualizar gráfico ao clicar
- **Tabela:** popular `#investments-table-body` com dados reais
- **Paginação:** controlar exibição de registros por página
- **Sidebar mobile:** toggle ao clicar em `#menu-toggle`

### `assets/js/investment.js`
- **Validação:** campos obrigatórios, formatos, valores mínimos
- **Preview em tempo real:** atualizar `#preview-amount`, `#preview-yield`, `#preview-total`
- **Salvar:** POST para API/banco → feedback ao usuário → redirecionar
- **Cálculo estimado:** `valor * (1 + taxa/100)` para projeção de 1 ano

---

## 🗄️ Sugestão de Backend / Banco de Dados

### Opção 1 — Firebase (BaaS serverless)
- **Firebase Authentication** para login/registro
- **Firestore** (NoSQL) para armazenar investimentos por usuário
- Integração simples via SDK no JavaScript
- Hospedagem gratuita no Firebase Hosting
- Documentação: https://firebase.google.com/docs

### Opção 2 — Supabase (alternativa open-source ao Firebase)
- **Supabase Auth** para autenticação
- **PostgreSQL** gerenciado para os dados
- API REST e cliente JS nativo
- Plano gratuito generoso
- Documentação: https://supabase.com/docs

### Opção 3 — Backend próprio (Node.js / Python)
- **Node.js + Express** ou **Python + FastAPI**
- **Banco de dados:** PostgreSQL ou MongoDB
- Autenticação com **JWT** (JSON Web Tokens)
- Recomendado para maior controle e escalabilidade

---

## 🚀 Como rodar localmente

Por ser um projeto estático (HTML/CSS/JS puro), basta abrir os arquivos em um servidor local.

### Usando VS Code (Live Server)
1. Instale a extensão **Live Server**
2. Clique com o botão direito em `login.html`
3. Selecione **"Open with Live Server"**

### Usando Python
```bash
cd invest-dashboard
python -m http.server 3000
# Acesse: http://localhost:3000/login.html
```

### Usando Node.js
```bash
npx serve invest-dashboard
# Acesse: http://localhost:3000/login.html
```

---

## 📦 Dependências externas

| Recurso          | Uso                          | URL                                      |
|------------------|------------------------------|------------------------------------------|
| Google Fonts     | DM Sans + DM Mono            | Carregado via `<link>` no HTML           |
| Chart.js (sugerida) | Gráfico em `#chart`       | https://www.chartjs.org/                 |
| ApexCharts (alt.)   | Gráfico em `#chart`       | https://apexcharts.com/                  |

> Nenhuma dependência está instalada atualmente. CSS e layout funcionam sem JavaScript.

---

## ✅ Boas práticas adotadas

- HTML5 semântico (`<main>`, `<aside>`, `<nav>`, `<article>`, `<section>`, `<header>`, `<footer>`)
- ARIA labels e roles para acessibilidade
- CSS modularizado por página
- Sistema de design com variáveis CSS consistentes
- Layout responsivo com CSS Grid e Flexbox
- Nenhum framework CSS ou JavaScript utilizado
- Arquivos JS apenas com comentários (zero lógica implementada)

---

## 📄 Licença

Projeto de uso pessoal/educacional. Livre para modificação.
