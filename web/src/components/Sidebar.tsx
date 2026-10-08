import { Home, ListMusic, History, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Sidebar({ 
  token, 
  currentView, 
  setCurrentView 
}: { 
  token: string, 
  currentView: string, 
  setCurrentView: (view: 'home' | 'playlists' | 'history' | 'settings') => void 
}) {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (token) {
      fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(err => console.error("Erro ao buscar perfil:", err));
    }
  }, [token]);

  return (
    <aside className="w-64 bg-dark-surface h-full flex flex-col p-6 border-r border-gray-800">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-8 h-8 rounded-full bg-spotify-green flex items-center justify-center">
          <ListMusic size={18} className="text-black" />
        </div>
        <h1 className="text-xl font-bold text-white">Spotify AI Playlist</h1>
      </div>

      <nav className="flex flex-col gap-4 flex-1">
        <button 
          onClick={() => setCurrentView('home')} 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-left transition-colors ${currentView === 'home' ? 'text-white bg-primary-purple/20' : 'text-gray-400 hover:text-white'}`}
        >
          <Home size={20} />
          Início
        </button>
        <button 
          onClick={() => setCurrentView('playlists')} 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-left transition-colors ${currentView === 'playlists' ? 'text-white bg-primary-purple/20' : 'text-gray-400 hover:text-white'}`}
        >
          <ListMusic size={20} />
          Minhas Playlists
        </button>
        <button 
          onClick={() => setCurrentView('history')} 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-left transition-colors ${currentView === 'history' ? 'text-white bg-primary-purple/20' : 'text-gray-400 hover:text-white'}`}
        >
          <History size={20} />
          Histórico
        </button>
        <button 
          onClick={() => setCurrentView('settings')} 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-left transition-colors ${currentView === 'settings' ? 'text-white bg-primary-purple/20' : 'text-gray-400 hover:text-white'}`}
        >
          <Settings size={20} />
          Configurações
        </button>
      </nav>

      {profile && (
        <div className="mt-auto flex items-center justify-between bg-[#110e19] p-4 rounded-xl border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden">
              <img 
                src={profile.images?.[0]?.url || `https://ui-avatars.com/api/?name=${profile.display_name}&background=1DB954&color=fff`} 
                alt={profile.display_name} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-white truncate">{profile.display_name}</span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-spotify-green"></span> Conectado
              </span>
            </div>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('spotify_token');
              window.location.reload();
            }}
            className="text-xs text-gray-500 hover:text-white underline"
          >
            Sair
          </button>
        </div>
      )}
    </aside>
  );
}
