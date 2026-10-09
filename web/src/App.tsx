import { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { PlaylistsView } from './components/views/PlaylistsView';
import { HistoryView } from './components/views/HistoryView';
import { SettingsView } from './components/views/SettingsView';
import { ListMusic } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import './App.css';

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'playlists' | 'history' | 'settings'>('home');

  useEffect(() => {
    // Aplica o tema salvo no localStorage
    const savedBgColor = localStorage.getItem('theme_dark_base');
    const savedTitleColor = localStorage.getItem('theme_text_title');
    const savedPrimaryColor = localStorage.getItem('theme_primary_purple');
    const savedSurfaceColor = localStorage.getItem('theme_dark_surface');
    const savedInnerColor = localStorage.getItem('theme_dark_inner');

    if (savedBgColor) document.documentElement.style.setProperty('--theme-dark-base', savedBgColor);
    if (savedTitleColor) document.documentElement.style.setProperty('--theme-text-title', savedTitleColor);
    if (savedPrimaryColor) document.documentElement.style.setProperty('--theme-primary-purple', savedPrimaryColor);
    if (savedSurfaceColor) document.documentElement.style.setProperty('--theme-dark-surface', savedSurfaceColor);
    if (savedInnerColor) document.documentElement.style.setProperty('--theme-dark-inner', savedInnerColor);

    // Verifica se há token na URL (vindo do redirecionamento do backend)
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(window.location.search);
    let accessToken = urlParams.get('access_token');

    if (accessToken) {
      setToken(accessToken);
      localStorage.setItem('spotify_token', accessToken);
      // Limpa a URL para não deixar o token exposto
      window.history.pushState({}, '', '/');
    } else {
      accessToken = localStorage.getItem('spotify_token');
      if (accessToken) {
        setToken(accessToken);
      }
    }
  }, []);

  const handleLogin = () => {
    // Redireciona para o nosso backend, que vai iniciar o fluxo do Spotify
    window.location.href = 'http://127.0.0.1:3000/api/auth/login';
  };

  if (!token) {
    return (
      <div className="flex h-screen bg-dark-base font-sans overflow-hidden items-center justify-center text-white relative">
        {/* Imagem de fundo com opacidade */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954]/10 to-dark-base z-0"></div>
        
        <div className="z-10 flex flex-col items-center bg-dark-surface p-12 rounded-2xl border border-gray-800 shadow-2xl max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-spotify-green flex items-center justify-center mb-6">
            <ListMusic size={32} className="text-black" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Spotify AI Playlist</h1>
          <p className="text-gray-400 mb-10">
            Transforme suas ideias em playlists reais. Conecte sua conta para começarmos.
          </p>
          
          <button 
            onClick={handleLogin}
            className="bg-spotify-green hover:bg-[#1ed760] text-black font-bold py-4 px-8 rounded-full w-full transition-transform hover:scale-105 active:scale-95"
          >
            Conectar com o Spotify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-dark-base font-sans overflow-hidden">
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1625',
            color: '#fff',
            border: '1px solid #332d4a',
          },
          success: {
            iconTheme: {
              primary: '#1DB954',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Sidebar token={token} currentView={currentView} setCurrentView={setCurrentView} />
      {currentView === 'home' && <MainContent token={token} />}
      {currentView === 'playlists' && <PlaylistsView token={token} />}
      {currentView === 'history' && <HistoryView />}
      {currentView === 'settings' && <SettingsView />}
    </div>
  );
}

export default App;
