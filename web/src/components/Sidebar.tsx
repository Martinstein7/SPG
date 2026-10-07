import { Home, ListMusic, History, Settings } from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="w-64 bg-dark-surface h-full flex flex-col p-6 border-r border-gray-800">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-8 h-8 rounded-full bg-spotify-green flex items-center justify-center">
          <ListMusic size={18} className="text-black" />
        </div>
        <h1 className="text-xl font-bold text-white">Spotify AI Playlist</h1>
      </div>

      <nav className="flex flex-col gap-4 flex-1">
        <a href="#" className="flex items-center gap-3 text-white bg-primary-purple/20 px-4 py-3 rounded-lg font-medium">
          <Home size={20} />
          Início
        </a>
        <a href="#" className="flex items-center gap-3 text-gray-400 hover:text-white px-4 py-3 rounded-lg font-medium transition-colors">
          <ListMusic size={20} />
          Minhas Playlists
        </a>
        <a href="#" className="flex items-center gap-3 text-gray-400 hover:text-white px-4 py-3 rounded-lg font-medium transition-colors">
          <History size={20} />
          Histórico
        </a>
        <a href="#" className="flex items-center gap-3 text-gray-400 hover:text-white px-4 py-3 rounded-lg font-medium transition-colors">
          <Settings size={20} />
          Configurações
        </a>
      </nav>

      <div className="mt-auto flex items-center gap-3 bg-[#110e19] p-4 rounded-xl border border-gray-800">
        <div className="w-10 h-10 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden">
          {/* Imagem do usuario viria aqui */}
          <img src="https://ui-avatars.com/api/?name=Willian&background=1DB954&color=fff" alt="User" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-sm font-bold text-white truncate">Willian</span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-spotify-green"></span> Conectado
          </span>
        </div>
      </div>
    </aside>
  );
}
