import { Search, Sparkles, Music, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { fetchAllUserPlaylists, enrichPlaylistTrackCounts, getPlaylistTrackCount } from '../utils/spotifyPlaylists';
import { API_BASE_URL } from '../config';

const DEFAULT_EXAMPLES = [
  'Vampiro melancólico', 
  'Dirigindo de madrugada', 
  'TSL + Deftones + HIM', 
  'Anos 2000'
];

export function MainContent({ token }: { token: string }) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingText, setLoadingText] = useState("Pensando...");
  const [playlistError, setPlaylistError] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [currentExamples, setCurrentExamples] = useState<string[]>(DEFAULT_EXAMPLES);
  const [isLoadingExamples, setIsLoadingExamples] = useState(false);
  const [trackCount, setTrackCount] = useState<number>(() => {
    return parseInt(localStorage.getItem('default_track_count') || '20', 10);
  });

  const fetchAiExamples = async () => {
    setIsLoadingExamples(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/suggestions`);
      const data = await response.json();
      if (data.suggestions && data.suggestions.length > 0) {
        setCurrentExamples(data.suggestions.slice(0, 4));
      }
    } catch (err) {
      console.error("Erro ao buscar exemplos da IA:", err);
      toast.error("Não foi possível gerar novas sugestões.", { id: 'sug-err' });
    } finally {
      setIsLoadingExamples(false);
    }
  };

  useEffect(() => {
    fetchAiExamples();
  }, []);

  useEffect(() => {
    let timeout1: ReturnType<typeof setTimeout>;
    let timeout2: ReturnType<typeof setTimeout>;
    let timeout3: ReturnType<typeof setTimeout>;

    if (isGenerating) {
      setLoadingText("Interpretando seu pedido com IA...");
      
      timeout1 = setTimeout(() => {
        setLoadingText("Escolhendo as melhores músicas...");
      }, 4000);

      timeout2 = setTimeout(() => {
        setLoadingText("Buscando faixas no Spotify...");
      }, 8000);

      timeout3 = setTimeout(() => {
        setLoadingText("Salvando a playlist na sua conta... Pode demorar se tiver muitas músicas!");
      }, 14000);
    }

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [isGenerating]);

  const loadPlaylists = async (userProf?: any) => {
    if (!token) return;
    try {
      let activeProf = userProf || profile;
      if (!activeProf) {
        activeProf = await fetch('https://api.spotify.com/v1/me', {
          headers: { Authorization: `Bearer ${token}` }
        }).then((res) => res.json());
        setProfile(activeProf);
      }

      const userPlaylists = await fetchAllUserPlaylists(token, activeProf);
      setPlaylists(userPlaylists);
      if (userPlaylists.length === 0) {
        setPlaylistError("Você ainda não possui playlists próprias ou colaborativas criadas.");
      } else {
        setPlaylistError(null);
      }

      // Em segundo plano, busca a quantidade real de faixas caso o Spotify retorne 0
      enrichPlaylistTrackCounts(userPlaylists, token, (updatedList) => {
        setPlaylists(updatedList);
      });
    } catch (err) {
      console.error("Erro ao carregar dados do usuário:", err);
      setPlaylistError("Erro ao carregar playlists do Spotify.");
    }
  };

  useEffect(() => {
    loadPlaylists();
  }, [token]);

  const handleGenerate = async () => {
    if(!prompt) return;
    
    // Pequena verificação na interface para avisar o usuário
    const numberMatch = prompt.match(/\b(\d+)\b/);
    if (numberMatch) {
      const num = parseInt(numberMatch[1], 10);
      if (num > 50 && num !== 80 && num !== 90 && num !== 2000) { // Ignorando anos comuns
        toast(`Você pediu ${num} músicas, mas limitei para as 50 melhores. Adicione mais depois!`, {
          icon: '⚠️',
          duration: 6000
        });
      }
    }

    setIsGenerating(true);
    setGenerateError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt, token, trackCount })
      });

      const data = await response.json();
      
      if (data.success && data.url) {
        toast.success("Playlist criada com sucesso no seu Spotify!");
        window.open(data.url, "_blank");

        // Salvar no Histórico local
        try {
          const historyItem = {
            id: data.playlistId || Date.now().toString(),
            name: data.playlistName || `SPG: ${prompt}`,
            prompt: prompt,
            url: data.url,
            trackCount: data.trackCount || trackCount,
            createdAt: new Date().toISOString()
          };
          const prevHistory = JSON.parse(localStorage.getItem('spg_history') || '[]');
          localStorage.setItem('spg_history', JSON.stringify([historyItem, ...prevHistory]));
        } catch (e) {
          console.error("Erro ao registrar no histórico:", e);
        }

        setPrompt(""); // Limpa o input
        
        // Atualiza a lista de playlists após 2 segundos pra dar tempo do Spotify processar
        setTimeout(() => {
          loadPlaylists();
        }, 2000);
      } else {
        setGenerateError(data.error || "Ocorreu um erro desconhecido.");
      }
    } catch (err) {
      setGenerateError("Erro de conexão com o servidor. Tente novamente mais tarde.");
    } finally {
      setIsGenerating(false);
      setLoadingText("Gerar Playlist");
    }
  };

  return (
    <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 md:p-10 bg-transparent text-white">
      {/* Cabeçalho de Boas Vindas */}
      <div className="mb-6 sm:mb-10 md:mb-12">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">
          Boas-vindas{profile?.display_name ? `, ${profile.display_name.split(' ')[0]}` : ''}!
        </h2>
        <p className="text-gray-400 text-sm sm:text-base md:text-lg">O que você quer ouvir hoje?</p>
      </div>

      {/* Barra de Pesquisa / Prompt */}
      <div className="max-w-3xl mb-8 sm:mb-12">
        <div className="relative group flex flex-col md:flex-row gap-2.5 md:gap-0 md:items-center">
          <div className="relative flex-1 flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={18} />
            </div>
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-dark-surface border border-gray-700 text-white rounded-xl py-3.5 sm:py-4 pl-10 sm:pl-12 pr-4 md:pr-60 focus:outline-none focus:border-primary-purple focus:ring-1 focus:ring-primary-purple transition-all text-sm sm:text-base md:text-lg"
              placeholder="Ex: Crie uma playlist para um vampiro melancólico..."
            />
          </div>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !prompt}
            className="w-full md:w-auto md:absolute md:inset-y-2 md:right-2 bg-primary-purple hover:bg-opacity-90 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 md:py-2 px-5 sm:px-6 rounded-xl md:rounded-lg flex items-center gap-2 transition-all md:min-w-[190px] justify-center cursor-pointer text-sm sm:text-base flex-shrink-0"
          >
            <Sparkles size={18} className={isGenerating ? "animate-pulse" : ""} />
            <span className="truncate max-w-[200px]">{isGenerating ? loadingText : "Gerar Playlist"}</span>
          </button>
        </div>
        
        {generateError && (
          <div className="mt-4 text-red-400 bg-[#3a1c1c] p-3.5 sm:p-4 rounded-xl border border-red-900/50 flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <strong className="block mb-1 text-sm sm:text-base">Ops, algo deu errado:</strong>
              <p className="text-xs sm:text-sm">{generateError}</p>
            </div>
          </div>
        )}

        {/* Configuração de Quantidade de Músicas */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 text-xs text-gray-400">
          <span className="w-full sm:w-auto font-medium">Quantidade:</span>
          {[10, 15, 20, 30, 50].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => setTrackCount(count)}
              className={`px-2.5 sm:px-3 py-1 rounded-lg border text-xs transition-all cursor-pointer ${
                trackCount === count
                  ? 'bg-primary-purple border-primary-purple text-white font-bold'
                  : 'bg-dark-inner border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
              }`}
            >
              {count} músicas
            </button>
          ))}
        </div>

        {/* Chips de Exemplo */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 sm:mt-4 text-xs sm:text-sm">
          <span className="text-gray-400 text-xs sm:text-sm">Exemplos:</span>
          {currentExamples.map((ex) => (
            <button 
              key={ex} 
              onClick={() => setPrompt(ex)}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-gray-700 bg-dark-surface hover:border-gray-500 text-gray-300 transition-colors text-xs sm:text-sm cursor-pointer"
            >
              {ex}
            </button>
          ))}
          <button 
            onClick={fetchAiExamples}
            disabled={isLoadingExamples}
            className="p-1.5 rounded-full text-gray-500 hover:text-white hover:bg-gray-800 transition-colors ml-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Gerar novas sugestões com IA"
          >
            <RefreshCw size={15} className={isLoadingExamples ? "animate-spin text-primary-purple" : ""} />
          </button>
        </div>
      </div>

      {/* Sua Playlists */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-xl sm:text-2xl font-bold">Sua Playlists</h3>
          <a href={profile?.external_urls?.spotify} target="_blank" className="text-xs sm:text-sm text-spotify-green hover:underline transition-colors flex items-center gap-1">
            Abrir Spotify &rarr;
          </a>
        </div>
        
        {playlistError ? (
          <div className="text-red-400 bg-dark-surface p-6 rounded-xl text-center border border-red-900/30 text-sm sm:text-base">
            {playlistError}
          </div>
        ) : playlists.length === 0 ? (
          <div className="text-gray-400 bg-dark-surface p-6 rounded-xl text-center border border-gray-800 text-sm sm:text-base">
            Carregando suas playlists...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
            {playlists.map((pl, i) => (
              <a 
                href={pl.external_urls?.spotify || '#'} 
                target="_blank" 
                key={pl.id || i} 
                className="bg-dark-surface p-3 sm:p-4 rounded-xl hover:bg-[#252033] transition-colors cursor-pointer group flex flex-col justify-between"
              >
                <div className="aspect-square bg-gray-800 rounded-lg mb-3 sm:mb-4 overflow-hidden flex items-center justify-center">
                  {pl.images && pl.images.length > 0 ? (
                    <img src={pl.images[0].url} alt={pl.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <Music size={32} className="text-gray-600 sm:w-10 sm:h-10" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm mb-0.5 sm:mb-1 truncate">{pl.name || 'Sem nome'}</h4>
                  <p className="text-[11px] sm:text-xs text-gray-400">{getPlaylistTrackCount(pl)} músicas • {pl.public ? 'Pública' : 'Privada'}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
