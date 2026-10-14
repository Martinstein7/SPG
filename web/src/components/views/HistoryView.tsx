import { useState, useEffect } from 'react';
import { History, Sparkles, ExternalLink, Copy, Trash2, Calendar, Music, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface HistoryItem {
  id: string;
  name: string;
  prompt: string;
  url: string;
  trackCount: number;
  createdAt: string;
}

export function HistoryView({ onNavigateHome }: { onNavigateHome?: () => void }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('spg_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      } else {
        // Pre-popula com a playlist que geramos hoje caso esteja vazio
        const initialItem: HistoryItem = {
          id: '10WHdIDfS38Af4jNfzRrUR',
          name: 'SPG: rock anos 2000 nostalgia',
          prompt: 'rock anos 2000 nostalgia',
          url: 'https://open.spotify.com/playlist/10WHdIDfS38Af4jNfzRrUR',
          trackCount: 15,
          createdAt: new Date().toISOString()
        };
        setHistory([initialItem]);
        localStorage.setItem('spg_history', JSON.stringify([initialItem]));
      }
    } catch (e) {
      console.error('Erro ao ler histórico:', e);
    }
  }, []);

  const handleClearHistory = () => {
    if (confirm('Tem certeza que deseja apagar todo o histórico de criações?')) {
      localStorage.removeItem('spg_history');
      setHistory([]);
      toast.success('Histórico apagado com sucesso.');
    }
  };

  const handleDeleteItem = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    localStorage.setItem('spg_history', JSON.stringify(updated));
    toast.success('Item removido do histórico.');
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copiado para a área de transferência!');
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return 'Data recente';
    }
  };

  const totalTracks = history.reduce((acc, curr) => acc + (curr.trackCount || 0), 0);

  return (
    <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 md:p-10 bg-transparent text-white">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 flex items-center gap-2.5 sm:gap-3">
            <History className="text-primary-purple flex-shrink-0" size={28} />
            Histórico de Criações
          </h2>
          <p className="text-gray-400 text-xs sm:text-base md:text-lg">
            Acompanhe todas as playlists já montadas com a IA e seus pedidos originais.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-2 px-3.5 py-2 bg-dark-surface hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-gray-800 hover:border-red-500/50 rounded-lg text-xs sm:text-sm font-bold transition-all self-start md:self-auto cursor-pointer"
          >
            <Trash2 size={15} />
            Limpar Histórico
          </button>
        )}
      </div>

      {history.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-dark-surface p-3.5 sm:p-5 rounded-xl border border-gray-800">
            <span className="text-gray-400 text-[10px] sm:text-xs uppercase font-bold tracking-wider">Playlists Geradas</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5 sm:mt-1">{history.length}</p>
          </div>
          <div className="bg-dark-surface p-3.5 sm:p-5 rounded-xl border border-gray-800">
            <span className="text-gray-400 text-[10px] sm:text-xs uppercase font-bold tracking-wider">Músicas Selecionadas</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-primary-purple mt-0.5 sm:mt-1">{totalTracks}</p>
          </div>
          <div className="bg-dark-surface p-3.5 sm:p-5 rounded-xl border border-gray-800">
            <span className="text-gray-400 text-[10px] sm:text-xs uppercase font-bold tracking-wider">Média por Playlist</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-spotify-green mt-0.5 sm:mt-1">
              {history.length ? Math.round(totalTracks / history.length) : 0} faixas
            </p>
          </div>
        </div>
      )}

      {/* Conteúdo */}
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 sm:p-16 text-center text-gray-400 bg-dark-surface rounded-2xl border border-gray-800">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-dark-inner flex items-center justify-center mb-4 text-gray-500">
            <History size={28} className="sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Nenhum histórico registrado</h3>
          <p className="max-w-md text-xs sm:text-sm text-gray-400 mb-6">
            Você ainda não gerou playlists nesta sessão. Peça sua primeira playlist na aba Início e ela ficará gravada aqui!
          </p>
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="bg-primary-purple hover:bg-opacity-90 text-white font-bold px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              Criar Playlist Agora
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="p-3.5 sm:p-5 bg-dark-surface rounded-xl border border-gray-800 hover:border-gray-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4"
            >
              {/* Informações Principais */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-primary-purple/20 text-primary-purple flex items-center justify-center flex-shrink-0">
                    <Music size={14} className="sm:w-4 sm:h-4" />
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-white truncate max-w-[240px] sm:max-w-md">{item.name}</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs bg-dark-inner border border-gray-700 text-gray-300">
                    {item.trackCount} músicas
                  </span>
                  <span className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500">
                    <Calendar size={11} />
                    {formatDate(item.createdAt)}
                  </span>
                </div>

                {/* Prompt Original */}
                <div className="flex items-start gap-2 bg-dark-inner p-2.5 sm:p-3 rounded-lg border border-gray-800/80 text-xs sm:text-sm">
                  <Sparkles size={15} className="text-primary-purple flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-[10px] sm:text-xs text-gray-400 block font-medium">Prompt utilizado:</span>
                    <span className="text-gray-200 italic font-medium break-words">"{item.prompt}"</span>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800/60">
                <button
                  onClick={() => handleCopyLink(item.url)}
                  title="Copiar Link"
                  className="p-2 sm:p-2.5 rounded-lg bg-dark-inner hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 transition-colors cursor-pointer"
                >
                  <Copy size={15} />
                </button>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-spotify-green hover:bg-[#1ed760] text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-transform hover:scale-105 active:scale-95"
                >
                  <ExternalLink size={15} />
                  Abrir no Spotify
                </a>

                <button
                  onClick={() => handleDeleteItem(item.id)}
                  title="Excluir do Histórico"
                  className="p-2 sm:p-2.5 rounded-lg bg-dark-inner hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-gray-700 transition-colors cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
