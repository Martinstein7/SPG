<div align="center">
  <img src="./web/src/assets/hero.png" alt="SPG Banner" width="600" />
  
  # 🎵 SPG (Spotify AI Playlist Generator)
  
  **Transforme suas ideias em playlists no Spotify.**
  Com o poder da inteligência artificial, você descreve o que quer ouvir — e nós cuidamos do resto.
</div>

---

## 🚀 Sobre o Projeto
O SPG é uma aplicação web que permite a criação de playlists personalizadas utilizando descrições em linguagem natural. A plataforma utiliza inteligência artificial (Gemini) para interpretar o clima, gênero, contexto cultural e criar a seleção musical perfeita diretamente na sua conta do Spotify.

## ✨ Funcionalidades
- **Login com Spotify (OAuth):** Autenticação segura acessando apenas o necessário.
- **Interpretação de IA:** Reconhecimento de intenções complexas (ex: "Criar uma playlist de vampiro melancólico em São Paulo de madrugada").
- **Ações Inteligentes:**
  - `CREATE`: Gera uma nova playlist.
  - `EXTEND`: Adiciona músicas seguindo a mesma vibe.
  - `REFINE`: Altera as características (ex: "deixa mais sombrio").
  - `REMIX`: Transforma a playlist com um novo contexto.
- **Integração Real-Time:** Criação e adição de faixas diretamente na sua conta do Spotify.

## 🛠️ Tecnologias
### Frontend (`/web`)
- React + TypeScript
- Vite
- Tailwind CSS

### Backend (`/api`)
- Node.js + TypeScript
- Express
- Integrações: **Spotify Web API** & **Google Gemini API**

## ⚙️ Como Executar Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/Martinstein7/SPG.git
   cd SPG
   ```

2. **Configuração de Variáveis de Ambiente:**
   - Entre na pasta `/api` e crie um arquivo `.env` baseado no `.env.example`.
   - Adicione suas credenciais do Spotify (`CLIENT_ID` e `CLIENT_SECRET`) e a `GEMINI_API_KEY`.

3. **Iniciando o Backend:**
   ```bash
   cd api
   npm install
   npm run dev
   ```

4. **Iniciando o Frontend:**
   ```bash
   cd web
   npm install
   npm run dev
   ```

---
<div align="center">
  Feito com 💜 por Willian
</div>
