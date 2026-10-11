import { useEffect, useState } from 'react';
import { Music, Sparkles, Plus, ExternalLink, X, Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function PlaylistsView({ token }: { token: string }) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);

  // Estados para expandir com IA
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCount, setAiCount] = useState(10);
  const [isExpandingAi, setIsExpandingAi] = useState(false);

  // Estados para busca manual
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingTrackUri, setAddingTrackUri] = useState<string | null>(null);

  // Carregar apenas playlists controladas ou colaborativas pelo usuário
  const fetchPlaylists = () => {
    setLoading(true);
    Promise.all([
      fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` }
      }).then((res) => res.json()),
      fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
        headers: { Authorization: `Bearer ${token}` }
      }).then((res) => res.json())
    ])
      .then(([userProfile, data]) => {
        if (data.items) {
          const editable = data.items.filter((pl: any) =>
            pl.collaborative || pl.owner?.id === userProfile.id
          );
          setPlaylists(editable);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlaylists();
  }, [token]);

  // Carregar faixas da playlist selecionada
  const fetchTracks = (playlistId: string) => {
    setLoadingTracks(true);
    fetch(`https://api.spotify.com/v1/playlists/${playlistId}/items?limit=50`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setPlaylistTracks(data.items);
        }
        setLoadingTracks(false);
      })
      .catch((err) => {
        console.error('Erro ao buscar faixas:', err);
        setLoadingTracks(false);
      });
  };

  const handleOpenPlaylist = (pl: any) => {
    setSelectedPlaylist(pl);
    setAiPrompt('');
    setSearchQuery('');
    setSearchResults([]);
    fetchTracks(pl.id);
  };

  const handleCloseModal = () => {
    setSelectedPlaylist(null);
    setPlaylistTracks([]);
  };

  // Expandir com IA
  const handleExpandWithAi = async () => {
    if (!selectedPlaylist) return;
    setIsExpandingAi(true);

    try {
      const currentSongStrings = playlistTracks.slice(0, 25).map((i: any) => {
        const track = i.item || i.track;
        if (!track) return null;
        return `"${track.name}" (${track.artists?.map((a: any) => a.name).join(', ')})`;
      }).filter(Boolean);

      const res = await fetch('http://127.0.0.1:3000/api/playlist/append-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlistId: selectedPlaylist.id,
          playlistName: selectedPlaylist.name,
          playlistDesc: selectedPlaylist.description,
          existingTracks: currentSongStrings,
          prompt: aiPrompt,
          token,
          trackCount: aiCount
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`${data.addedCount} novas músicas adicionadas pela IA!`);
        setAiPrompt('');
        fetchTracks(selectedPlaylist.id);
        fetchPlaylists();
      } else {
        toast.error(data.error || 'Erro ao adicionar músicas com IA.');
      }
    } catch {
      toast.error('Erro ao comunicar com o servidor.');
    } finally {
      setIsExpandingAi(false);
    }
  };

  // Busca manual no Spotify
  const handleSearchTracks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=5`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.tracks?.items) {
        setSearchResults(data.tracks.items);
      }
    } catch (err) {
      console.error('Erro na busca de faixas:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Adicionar faixa manual
  const handleAddManualTrack = async (track: any) => {
    if (!selectedPlaylist) return;
    setAddingTrackUri(track.uri);

    try {
      const res = await fetch('http://127.0.0.1:3000/api/playlist/append-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlistId: selectedPlaylist.id,
          uri: track.uri,
          token
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`"${track.name}" adicionada!`);
        fetchTracks(selectedPlaylist.id);
        fetchPlaylists();
      } else {
        toast.error(data.error || 'Erro ao adicionar música.');
      }
    } catch {
      toast.error('Erro ao conectar ao servidor.');
    } finally {
      setAddingTrackUri(null);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <main className="flex-1 h-full overflow-y-auto p-10 bg-transparent text-white">
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2">Minhas Playlists</h2>
        <p className="text-gray-400 text-lg">
          Gerencie e adicione músicas às suas playlists existentes pelo app.
        </p>
      </div>

      {loading ? (
        <div className="text-gray-400 flex items-center gap-2">
          <Loader2 className="animate-spin text-primary-purple" size={20} />
          Carregando playlists...
        </div>
      ) : playlists.length === 0 ? (
        <div className="text-gray-400">Nenhuma playlist encontrada.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {playlists.map((pl, i) => (
            <div
              key={pl.id || i}
              onClick={() => handleOpenPlaylist(pl)}
              className="bg-dark-surface p-4 rounded-xl hover:bg-[#252033] border border-gray-800 hover:border-primary-purple/50 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="aspect-square bg-gray-800 rounded-lg mb-4 overflow-hidden flex items-center justify-center relative">
                  {pl.images && pl.images.length > 0 ? (
                    <img
                      src={pl.images[0].url}
                      alt={pl.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <Music size={40} className="text-gray-600" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-xs bg-primary-purple font-bold px-3 py-1.5 rounded-full shadow-lg">
                      Gerenciar
                    </span>
                  </div>
                </div>
                <h4 className="font-bold text-white mb-1 truncate">{pl.name || 'Sem nome'}</h4>
                <p className="text-xs text-gray-400">
                  {pl.tracks?.total || 0} músicas • {pl.public ? 'Pública' : 'Privada'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalhes e Gerenciamento da Playlist */}
      {selectedPlaylist && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-surface border border-gray-700 w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            {/* Cabeçalho do Modal */}
            <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-dark-inner/50">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {selectedPlaylist.images && selectedPlaylist.images.length > 0 ? (
                    <img
                      src={selectedPlaylist.images[0].url}
                      alt={selectedPlaylist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Music size={28} className="text-gray-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">{selectedPlaylist.name}</h3>
                  <p className="text-sm text-gray-400">
                    {playlistTracks.length} faixas listadas • {selectedPlaylist.public ? 'Pública' : 'Privada'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={selectedPlaylist.external_urls?.spotify}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-spotify-green hover:bg-[#1ed760] text-black font-bold rounded-lg text-sm flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink size={16} />
                  Abrir no Spotify
                </a>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Bloco 1: Ações de Adicionar Músicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Opção A: Expandir com IA */}
                <div className="p-4 bg-dark-inner rounded-xl border border-gray-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="text-primary-purple" size={18} />
                      <h4 className="font-bold text-sm">Expandir Playlist com IA</h4>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">
                      A IA gera e adiciona automaticamente novas músicas à playlist.
                    </p>

                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Ex: mais músicas no mesmo ritmo, ou adicione rock clássico..."
                      className="w-full bg-dark-surface border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-purple mb-3"
                    />

                    <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
                      <span>Adicionar:</span>
                      {[5, 10, 15].map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => setAiCount(cnt)}
                          className={`px-2.5 py-1 rounded-md border ${
                            aiCount === cnt
                              ? 'bg-primary-purple border-primary-purple text-white font-bold'
                              : 'bg-dark-surface border-gray-700 text-gray-400 hover:text-white'
                          }`}
                        >
                          +{cnt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleExpandWithAi}
                    disabled={isExpandingAi}
                    className="w-full bg-primary-purple hover:bg-opacity-90 disabled:bg-gray-700 text-white font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    {isExpandingAi ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Gerando faixas com IA...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Adicionar com IA
                      </>
                    )}
                  </button>
                </div>

                {/* Opção B: Buscar música manual */}
                <div className="p-4 bg-dark-inner rounded-xl border border-gray-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Search className="text-spotify-green" size={18} />
                      <h4 className="font-bold text-sm">Buscar e Adicionar Música</h4>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">
                      Pesquise faixas específicas no catálogo do Spotify.
                    </p>

                    <form onSubmit={handleSearchTracks} className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Nome da música ou artista..."
                        className="flex-1 bg-dark-surface border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-spotify-green"
                      />
                      <button
                        type="submit"
                        disabled={isSearching || !searchQuery.trim()}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-bold flex items-center gap-1 disabled:opacity-50"
                      >
                        {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                      </button>
                    </form>

                    {/* Resultados da busca */}
                    {searchResults.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {searchResults.map((track) => (
                          <div
                            key={track.id}
                            className="flex items-center justify-between p-2 bg-dark-surface rounded-lg text-xs"
                          >
                            <div className="truncate max-w-[200px]">
                              <p className="font-bold truncate text-white">{track.name}</p>
                              <p className="text-gray-400 truncate">
                                {track.artists?.map((a: any) => a.name).join(', ')}
                              </p>
                            </div>
                            <button
                              onClick={() => handleAddManualTrack(track)}
                              disabled={addingTrackUri === track.uri}
                              className="px-2.5 py-1 bg-spotify-green hover:bg-[#1ed760] disabled:bg-gray-700 text-black font-bold rounded-md flex items-center gap-1"
                            >
                              {addingTrackUri === track.uri ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Plus size={12} />
                              )}
                              Adicionar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bloco 2: Lista de Músicas Existentes */}
              <div>
                <h4 className="font-bold text-lg mb-3">Músicas na Playlist</h4>

                {loadingTracks ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 py-6">
                    <Loader2 size={16} className="animate-spin text-primary-purple" />
                    Carregando faixas da playlist...
                  </div>
                ) : playlistTracks.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4">Nenhuma música encontrada nesta playlist.</p>
                ) : (
                  <div className="space-y-1">
                    {playlistTracks.map((item, idx) => {
                      const track = item.item || item.track;
                      if (!track) return null;
                      return (
                        <div
                          key={track.id || idx}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-dark-inner transition-colors text-sm"
                        >
                          <div className="flex items-center gap-3 truncate">
                            <span className="text-gray-500 text-xs w-5 text-right">{idx + 1}</span>
                            <div className="w-10 h-10 rounded bg-gray-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
                              {track.album?.images && track.album.images.length > 0 ? (
                                <img
                                  src={track.album.images[0].url}
                                  alt={track.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Music size={18} className="text-gray-600" />
                              )}
                            </div>
                            <div className="truncate">
                              <p className="font-bold text-white truncate">{track.name}</p>
                              <p className="text-xs text-gray-400 truncate">
                                {track.artists?.map((a: any) => a.name).join(', ')}
                              </p>
                            </div>
                          </div>

                          <div className="text-xs text-gray-400 flex-shrink-0 ml-4">
                            {formatDuration(track.duration_ms || 0)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
