import { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { PlaylistsView } from './components/views/PlaylistsView';
import { HistoryView } from './components/views/HistoryView';
import { SettingsView } from './components/views/SettingsView';
import { PlayerBar } from './components/PlayerBar';
import { MobileNav } from './components/MobileNav';
import { MobileHeader } from './components/MobileHeader';
import { ListMusic, AlertTriangle, LogOut, RefreshCw } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { API_BASE_URL } from './config';
import './App.css';

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [authForbidden, setAuthForbidden] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'playlists' | 'history' | 'settings'>('home');

  const handleLogout = () => {
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expiry');
    setToken(null);
    setAuthForbidden(false);
  };

  const handleLogin = () => {
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expiry');
    window.location.href = `${API_BASE_URL}/api/auth/login`;
  };

  const tryRefreshToken = async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    if (!refreshToken) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem('spotify_token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('spotify_refresh_token', data.refresh_token);
        }
        if (data.expires_in) {
          localStorage.setItem('spotify_token_expiry', String(Date.now() + Number(data.expires_in) * 1000));
        }
        setToken(data.access_token);
        return data.access_token;
      }
    } catch (e) {
      console.error('Erro ao renovar token:', e);
    }
    return null;
  };

  useEffect(() => {
    // Aplica o tema salvo no localStorage
    const savedBgColor = localStorage.getItem('theme_dark_base');
    const savedTitleColor = localStorage.getItem('theme_text_title');
    const savedPrimaryColor = localStorage.getItem('theme_primary_purple');
    const savedSurfaceColor = localStorage.getItem('theme_dark_surface');
    const savedInnerColor = localStorage.getItem('theme_dark_inner');
    const savedBgImage = localStorage.getItem('theme_bg_image');

    if (savedBgColor) document.documentElement.style.setProperty('--theme-dark-base', savedBgColor);
    if (savedTitleColor) document.documentElement.style.setProperty('--theme-text-title', savedTitleColor);
    if (savedPrimaryColor) document.documentElement.style.setProperty('--theme-primary-purple', savedPrimaryColor);
    if (savedSurfaceColor) document.documentElement.style.setProperty('--theme-dark-surface', savedSurfaceColor);
    if (savedInnerColor) document.documentElement.style.setProperty('--theme-dark-inner', savedInnerColor);
    if (savedBgImage) document.documentElement.style.setProperty('--theme-bg-image', `url("${savedBgImage}")`);

    // Verifica se há token na URL (vindo do redirecionamento do backend)
    const urlParams = new URLSearchParams(window.location.search);
    const urlAccessToken = urlParams.get('access_token');
    const urlRefreshToken = urlParams.get('refresh_token');
    const urlExpiresIn = urlParams.get('expires_in');
    const urlError = urlParams.get('error');

    if (urlError) {
      window.history.pushState({}, '', '/');
      toast.error('Falha na autenticação com o Spotify. Tente novamente.');
    }

    if (urlAccessToken) {
      setToken(urlAccessToken);
      localStorage.setItem('spotify_token', urlAccessToken);
      if (urlRefreshToken) {
        localStorage.setItem('spotify_refresh_token', urlRefreshToken);
      }
      if (urlExpiresIn) {
        localStorage.setItem('spotify_token_expiry', String(Date.now() + Number(urlExpiresIn) * 1000));
      }
      // Limpa a URL para não deixar o token exposto
      window.history.pushState({}, '', '/');
    } else {
      const storedToken = localStorage.getItem('spotify_token');
      if (storedToken) {
        setToken(storedToken);
      }
    }
  }, []);

  // Valida o token atual no Spotify para evitar ficar preso em tela vazia/roxa se expirar ou se a conta não estiver no Developer Dashboard
  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const verifySession = async () => {
      try {
        const res = await fetch('https://api.spotify.com/v1/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (cancelled) return;

        if (res.status === 401) {
          // Token expirou -> tenta renovar automaticamente
          const newToken = await tryRefreshToken();
          if (!newToken && !cancelled) {
            handleLogout();
            toast.error('Sua sessão expirou. Conecte-se novamente ao Spotify.');
          }
        } else if (res.status === 403) {
          // Conta não cadastrada no User Management do Spotify Developer Dashboard
          setAuthForbidden(true);
        } else if (res.ok) {
          setAuthForbidden(false);
        }
      } catch (err) {
        console.error('Erro ao validar sessão Spotify:', err);
      }
    };

    verifySession();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) {
    return (
      <div className="flex h-[100dvh] min-h-screen bg-dark-base font-sans overflow-hidden items-center justify-center text-white relative px-4">
        {/* Imagem de fundo com opacidade */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954]/10 to-dark-base z-0"></div>
        
        <div className="z-10 flex flex-col items-center bg-dark-surface p-6 sm:p-10 rounded-2xl border border-gray-800 shadow-2xl max-w-md w-full text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-spotify-green flex items-center justify-center mb-5 sm:mb-6">
            <ListMusic size={28} className="text-black sm:w-8 sm:h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Spotify AI Playlist</h1>
          <p className="text-gray-400 text-sm sm:text-base mb-8 sm:mb-10">
            Transforme suas ideias em playlists reais. Conecte sua conta para começarmos.
          </p>
          
          <button 
            onClick={handleLogin}
            className="bg-spotify-green hover:bg-[#1ed760] text-black font-bold py-3.5 sm:py-4 px-6 sm:px-8 rounded-full w-full transition-transform hover:scale-105 active:scale-95 text-sm sm:text-base cursor-pointer"
          >
            Conectar com o Spotify
          </button>
        </div>
      </div>
    );
  }

  if (authForbidden) {
    return (
      <div className="flex h-[100dvh] min-h-screen bg-dark-base font-sans overflow-y-auto items-center justify-center text-white relative p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-dark-base z-0"></div>

        <div className="z-10 flex flex-col items-center bg-dark-surface p-6 sm:p-8 rounded-2xl border border-amber-500/40 shadow-2xl max-w-lg w-full text-center">
          <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Conta ainda não autorizada no Spotify</h2>
          <p className="text-gray-300 text-xs sm:text-sm mb-4 leading-relaxed">
            Por regra do próprio Spotify, aplicativos em <strong>Modo de Desenvolvimento (Development Mode)</strong> só permitem o acesso de contas cujos e-mails foram adicionados na lista de usuários de teste do painel.
          </p>
          <div className="bg-dark-inner border border-gray-800 rounded-xl p-3.5 text-left text-xs text-gray-400 mb-6 w-full space-y-1.5">
            <p className="font-bold text-white">Como liberar esta conta em 1 minuto:</p>
            <p>1. Acesse <span className="text-spotify-green">developer.spotify.com/dashboard</span></p>
            <p>2. Abra o app do SPG e clique na aba <strong>User Management</strong></p>
            <p>3. Adicione o <strong>Nome</strong> e o <strong>E-mail do Spotify</strong> desta conta.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={handleLogin}
              className="flex-1 bg-spotify-green hover:bg-[#1ed760] text-black font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm cursor-pointer transition-colors"
            >
              <RefreshCw size={16} />
              Trocar de Conta
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 bg-dark-inner hover:bg-gray-800 text-gray-300 font-bold py-3 px-4 rounded-xl border border-gray-700 flex items-center justify-center gap-2 text-sm cursor-pointer transition-colors"
            >
              <LogOut size={16} />
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-transparent font-sans overflow-hidden">
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
      {/* Top Header no Mobile */}
      <MobileHeader token={token} onLogout={handleLogout} />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar token={token} currentView={currentView} setCurrentView={setCurrentView} onLogout={handleLogout} />
        {currentView === 'home' && <MainContent token={token} />}
        {currentView === 'playlists' && <PlaylistsView token={token} />}
        {currentView === 'history' && <HistoryView onNavigateHome={() => setCurrentView('home')} />}
        {currentView === 'settings' && <SettingsView />}
      </div>

      {/* Mini Player */}
      <PlayerBar token={token} />

      {/* Bottom Bar de Navegação no Mobile */}
      <MobileNav currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  );
}

export default App;
