import { Search, Sparkles, Music } from 'lucide-react';
import { useEffect, useState } from 'react';

export function MainContent({ token }: { token: string }) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingText, setLoadingText] = useState("Pensando...");
  const [playlistError, setPlaylistError] = useState<string | null>(null);

  useEffect(() => {
    let timeout1: NodeJS.Timeout;
    let timeout2: NodeJS.Timeout;
    let timeout3: NodeJS.Timeout;

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

  useEffect(() => {
    if (token) {
      // Buscar perfil
      fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(err => console.error("Erro Perfil:", err));

      // Buscar playlists reais do usuario
      fetch('https://api.spotify.com/v1/me/playlists?limit=10', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setPlaylistError(data.error.message);
        } else if (data.items) {
          setPlaylists(data.items);
          if (data.items.length === 0) {
            setPlaylistError("Sua conta do Spotify retornou 0 playlists. Você realmente tem playlists criadas?");
          }
        }
      })
      .catch(err => setPlaylistError(err.toString()));
    }
  }, [token]);

  const handleGenerate = async () => {
    if(!prompt) return;
    
    // Pequena verificação na interface para avisar o usuário
    const numberMatch = prompt.match(/\b(\d+)\b/);
    if (numberMatch) {
      const num = parseInt(numberMatch[1], 10);
      if (num > 50 && num !== 80 && num !== 90 && num !== 2000) { // Ignorando anos comuns
        alert(`Você pediu ${num} músicas, mas para evitar bloqueios do Spotify e lentidão, eu vou limitar as 50 melhores por enquanto! No futuro, você poderá adicionar mais músicas direto na playlist.`);
      }
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('http://127.0.0.1:3000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt, token })
      });

      const data = await response.json();
      
      if (data.success && data.url) {
        alert("Playlist criada com sucesso no seu Spotify!");
        window.open(data.url, "_blank");
        setPrompt(""); // Limpa o input
        
        // Atualiza a lista de playlists após 2 segundos pra dar tempo do Spotify processar
        setTimeout(() => {
          fetch('https://api.spotify.com/v1/me/playlists?limit=10', {
            headers: { Authorization: `Bearer ${token}` }
          })
          .then(res => res.json())
          .then(data => {
            if(data.items) setPlaylists(data.items);
          });
        }, 2000);
      } else {
        alert("Ops, deu um erro: " + data.error);
      }
    } catch (err) {
      alert("Erro de conexão com o servidor.");
    } finally {
      setIsGenerating(false);
      setLoadingText("Gerar Playlist");
    }
  };

  return (
    <main className="flex-1 h-full overflow-y-auto p-10 bg-dark-base text-white">
      {/* Cabeçalho de Boas Vindas */}
      <div className="mb-12">
        <h2 className="text-4xl font-bold mb-2">
          Boas-vindas{profile ? `, ${profile.display_name.split(' ')[0]}` : ''}!
        </h2>
        <p className="text-gray-400 text-lg">O que você quer ouvir hoje?</p>
      </div>

      {/* Barra de Pesquisa / Prompt */}
      <div className="max-w-3xl mb-12">
        <div className="relative group flex items-center">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-gray-400" size={20} />
          </div>
          <input 
            type="text" 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-dark-surface border border-gray-700 text-white rounded-xl py-4 pl-12 pr-64 focus:outline-none focus:border-primary-purple focus:ring-1 focus:ring-primary-purple transition-all text-lg"
            placeholder="Ex: Crie uma playlist para um vampiro melancólico..."
          />
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !prompt}
            className={`absolute inset-y-2 right-2 bg-primary-purple hover:bg-opacity-90 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-all min-w-[200px] justify-center`}
          >
            <Sparkles size={18} className={isGenerating ? "animate-pulse" : ""} />
            <span className="truncate max-w-[200px]">{isGenerating ? loadingText : "Gerar Playlist"}</span>
          </button>
        </div>
        
        {/* Chips de Exemplo */}
        <div className="flex flex-wrap items-center gap-3 mt-4 text-sm">
          <span className="text-gray-400">Exemplos:</span>
          {['Vampiro', 'Dirigindo de madrugada', 'TSL + Deftones + HIM', 'Anos 2000'].map((ex) => (
            <button 
              key={ex} 
              onClick={() => setPrompt(ex)}
              className="px-3 py-1.5 rounded-full border border-gray-700 bg-dark-surface hover:border-gray-500 text-gray-300 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Suas Playlists REAIS */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">Suas playlists reais</h3>
          <a href={profile?.external_urls?.spotify} target="_blank" className="text-sm text-spotify-green hover:underline transition-colors">Abrir Spotify &rarr;</a>
        </div>
        
        {playlistError ? (
          <div className="text-red-400 bg-dark-surface p-6 rounded-xl text-center border border-red-900/30">
            {playlistError}
          </div>
        ) : playlists.length === 0 ? (
          <div className="text-gray-400 bg-dark-surface p-6 rounded-xl text-center border border-gray-800">
            Carregando suas playlists...
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
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
                <p className="text-xs text-gray-400">{pl.tracks?.total || 0} músicas • {pl.public ? 'Pública' : 'Privada'}</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
