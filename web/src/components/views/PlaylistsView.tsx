import { useEffect, useState } from 'react';
import { Music } from 'lucide-react';

export function PlaylistsView({ token }: { token: string }) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.items) setPlaylists(data.items);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, [token]);

  return (
    <main className="flex-1 h-full overflow-y-auto p-10 bg-dark-base text-white">
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2">Minhas Playlists</h2>
        <p className="text-gray-400 text-lg">Todas as playlists salvas no seu Spotify.</p>
      </div>

      {loading ? (
        <div className="text-gray-400">Carregando...</div>
      ) : playlists.length === 0 ? (
        <div className="text-gray-400">Nenhuma playlist encontrada.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {playlists.map((pl, i) => (
            <a 
              href={pl.external_urls?.spotify || '#'} 
              target="_blank" 
              key={pl.id || i} 
              className="bg-dark-surface p-4 rounded-xl hover:bg-[#252033] transition-colors cursor-pointer group"
            >
              <div className="aspect-square bg-gray-800 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
                {pl.images && pl.images.length > 0 ? (
                  <img src={pl.images[0].url} alt={pl.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <Music size={40} className="text-gray-600" />
                )}
              </div>
              <h4 className="font-bold text-white mb-1 truncate">{pl.name || 'Sem nome'}</h4>
              <p className="text-xs text-gray-400">{pl.tracks?.total || 0} músicas</p>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}

