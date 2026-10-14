<div align="center">
  <img src="./web/src/assets/hero.png" alt="SPG Banner" width="600" />
  
  # 🎵 SPG (Spotify AI Playlist Generator)
  
  **Transforme suas ideias e sentimentos em playlists perfeitas no Spotify.**  
  Descreva qualquer clima, contexto ou combinação inusitada — a inteligência artificial cuida da curadoria e cria tudo direto na sua conta.

  <p align="center">
    <a href="https://spg-five.vercel.app" target="_blank">
      <img src="https://img.shields.io/badge/Acessar%20App%20Online-spg--five.vercel.app-1DB954?style=for-the-badge&logo=spotify&logoColor=white" alt="Live Demo" />
    </a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node" />
    <img src="https://img.shields.io/badge/Vercel-Frontend-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel" />
    <img src="https://img.shields.io/badge/Render-Backend-46E3B7?style=flat-square&logo=render&logoColor=black" alt="Render" />
  </p>
</div>

---

## 🌐 Demonstração Online

O projeto está publicado e pronto para uso em:  
👉 **[https://spg-five.vercel.app](https://spg-five.vercel.app)**

---

## 🚀 Sobre o Projeto

O **SPG** é uma aplicação completa que conecta a inteligência artificial (Google Gemini, Groq e OpenAI) à **Spotify Web API**. Seja um pedido simples como *"Rock clássico dos anos 70"* ou algo super específico como *"Vampiro melancólico andando de carro de madrugada"*, a IA interpreta o contexto e a sonoridade ideal, gerando seleções musicais coerentes e adicionando as faixas diretamente na biblioteca do Spotify.

---

## ✨ Principais Funcionalidades

- 🔐 **Autenticação Segura (Spotify OAuth 2.0):** Conexão oficial com a conta do usuário com tokens protegidos.
- 🤖 **Curadoria Musical com IA Multi-Provedor:**
  - Modelo principal com **Google Gemini 3.8 Flash**.
  - Sistema inteligente de fallback e redundância com **Groq** e **OpenAI**.
  - Controle customizável da quantidade de faixas (de 5 a 50 músicas).
- 📂 **Gerenciamento Completo de Playlists:**
  - Filtro automático: exibe apenas playlists que o usuário é dono ou colaborador (sem poluição com playlists de terceiros).
  - Enriquecimento e paginação para contas com dezenas de playlists.
  - Expansão inteligente: adiciona novas músicas mantendo a mesma harmonia e estilo da playlist selecionada.
  - Busca manual integrada para adicionar faixas avulsas em tempo real.
- 📜 **Histórico de Criações:**
  - Registro de todas as playlists geradas com IA, acompanhando títulos, descrições, prompts originais e data de criação.
- 🎧 **Player em Tempo Real:**
  - Mini-player que identifica a música reproduzindo no momento no Spotify, com barra de progresso, botões de toque e atalho rápido.
- 🎨 **Personalização e Estilo:**
  - Temas de cores customizáveis, fundos por IA e upload de imagens próprias com ajuste responsivo.
- 📱 **Interface 100% Responsiva (Mobile & Desktop):**
  - Barra de navegação inferior (*Bottom Navigation Bar*) estilo aplicativo nativo para Android e iOS.
  - Mini-player compacto adaptado para telas de toque com respeito às *Safe Areas* do iPhone.

---

## 🛠️ Tecnologias

### Frontend (`/web`)
- **React 19** + **TypeScript**
- **Vite** (Build ultra-rápido)
- **Tailwind CSS v4**
- **Lucide React** (Ícones modernos)
- **React Hot Toast** (Notificações visuais)

### Backend (`/api`)
- **Node.js** + **Express**
- **TypeScript** com **TSX**
- **Google GenAI SDK** (`@google/genai`)
- **OpenAI SDK** & **Groq API**
- **Axios** & **Spotify Web API**

---

## ⚙️ Como Executar Localmente

### 1. Clonar o Repositório
```bash
git clone https://github.com/Martinstein7/SPG.git
cd SPG
```

### 2. Configurar o Backend (`/api`)
Crie um arquivo `.env` dentro da pasta `api`:
```env
PORT=3000
SPOTIFY_CLIENT_ID=seu_client_id
SPOTIFY_CLIENT_SECRET=seu_client_secret
REDIRECT_URI=http://127.0.0.1:3000/api/auth/callback
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=sua_chave_gemini
GROQ_API_KEY=sua_chave_groq
OPENAI_API_KEY=sua_chave_openai
```

Inicie o backend:
```bash
cd api
npm install
npm run dev
```

### 3. Configurar o Frontend (`/web`)
Inicie o frontend:
```bash
cd ../web
npm install
npm run dev
```

O aplicativo estará acessível em `http://localhost:5173`.

---

## ☁️ Deploy em Produção

- **Frontend:** Hospedado na [Vercel](https://vercel.com) com domínio gratuito `spg-five.vercel.app`.
- **Backend:** Hospedado no [Render](https://render.com) com serviços Node.js gerenciados e HTTPS automático.

---

<div align="center">
  Desenvolvido com 💜 por Willian
</div>
