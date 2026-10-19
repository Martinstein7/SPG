import { Home, ListMusic, History, Settings, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Sidebar({ 
  token, 
  currentView, 
  setCurrentView,
  onLogout
}: { 
  token: string, 
  currentView: string, 
  setCurrentView: (view: 'home' | 'playlists' | 'history' | 'settings') => void,
  onLogout?: () => void
}) {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (token) {
      fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Erro ao carregar perfil');
        return res.json();
      })
      .then(data => {
        if (data && !data.error) setProfile(data);
      })
      .catch(err => console.error("Erro ao buscar perfil:", err));
    }
  }, [token]);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('spotify_token');
      localStorage.removeItem('spotify_refresh_token');
      localStorage.removeItem('spotify_token_expiry');
      window.location.reload();
    }
  };

  return (
    <aside className="hidden md:flex w-64 bg-dark-surface h-full flex-col p-6 border-r border-gray-800 flex-shrink-0 select-none">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-8 h-8 rounded-full bg-spotify-green flex items-center justify-center">
          <ListMusic size={18} className="text-black" />
        </div>
        <h1 className="text-xl font-bold text-white">Spotify AI Playlist</h1>
      </div>

      <nav className="flex flex-col gap-4 flex-1">
        <button 
          onClick={() => setCurrentView('home')} 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-left transition-colors cursor-pointer ${currentView === 'home' ? 'text-white bg-primary-purple/20' : 'text-gray-400 hover:text-white'}`}
        >
          <Home size={20} />
          Início
        </button>
        <button 
          onClick={() => setCurrentView('playlists')} 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-left transition-colors cursor-pointer ${currentView === 'playlists' ? 'text-white bg-primary-purple/20' : 'text-gray-400 hover:text-white'}`}
        >
          <ListMusic size={20} />
          Minhas Playlists
        </button>
        <button 
          onClick={() => setCurrentView('history')} 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-left transition-colors cursor-pointer ${currentView === 'history' ? 'text-white bg-primary-purple/20' : 'text-gray-400 hover:text-white'}`}
        >
          <History size={20} />
          Histórico
        </button>
        <button 
          onClick={() => setCurrentView('settings')} 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-left transition-colors cursor-pointer ${currentView === 'settings' ? 'text-white bg-primary-purple/20' : 'text-gray-400 hover:text-white'}`}
        >
          <Settings size={20} />
          Configurações
        </button>
      </nav>

      <div className="mt-auto flex items-center justify-between bg-dark-inner p-4 rounded-xl border border-gray-800 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden">
            <img 
              src={profile?.images?.[0]?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.display_name || 'U')}&background=1DB954&color=fff`} 
              alt={profile?.display_name || 'Usuário'} 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="flex flex-col overflow-hidden min-w-0">
            <span className="text-sm font-bold text-white truncate">{profile?.display_name || 'Conta Spotify'}</span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-spotify-green"></span> Conectado
            </span>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          title="Sair / Trocar conta"
          className="text-xs text-gray-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-800 transition-colors flex-shrink-0 cursor-pointer"
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </aside>
  );
}
