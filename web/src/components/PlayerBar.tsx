import { useEffect, useState, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Laptop, ExternalLink, RefreshCw, Music2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface PlayerBarProps {
  token: string | null;
}

export function PlayerBar({ token }: PlayerBarProps) {
  const [playback, setPlayback] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressMs, setProgressMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [isControlling, setIsControlling] = useState(false);
  const [hasDevice, setHasDevice] = useState(false);
  const intervalRef = useRef<any>(null);

  const formatTime = (ms: number) => {
    if (!ms || isNaN(ms)) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const fetchPlayback = async () => {
    if (!token) return;

    try {
      const res = await fetch('https://api.spotify.com/v1/me/player', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 204 || res.status > 400) {
        // Nada tocando no momento ou token expirado
        setPlayback(null);
        setIsPlaying(false);
        setHasDevice(false);
        return;
      }

      const data = await res.json();
      if (data && data.item) {
        setPlayback(data);
        setIsPlaying(data.is_playing);
        setProgressMs(data.progress_ms || 0);
        setDurationMs(data.item.duration_ms || 0);
        setHasDevice(!!data.device);
      } else {
        setPlayback(null);
        setIsPlaying(false);
        setHasDevice(false);
      }
    } catch {
      // Ignora erros ocasionais de rede em background
    }
  };

  useEffect(() => {
    fetchPlayback();
    intervalRef.current = setInterval(fetchPlayback, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [token]);

  // Incrementa a barra de progresso a cada segundo se estiver tocando
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && durationMs > 0) {
      timer = setInterval(() => {
        setProgressMs((prev) => {
          if (prev >= durationMs) return durationMs;
          return prev + 1000;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, durationMs]);

  const handleTogglePlay = async () => {
    if (!token) return;
    setIsControlling(true);
    const endpoint = isPlaying ? 'pause' : 'play';

    try {
      const res = await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 204) {
        setIsPlaying(!isPlaying);
        setTimeout(fetchPlayback, 400);
      } else if (res.status === 403) {
        toast.error('O controle de reprodução requer o Spotify aberto em um dispositivo com plano Premium.', { id: 'player-error' });
      } else if (res.status === 404) {
        toast.error('Nenhum dispositivo ativo encontrado. Abra o Spotify e dê play primeiro!', { id: 'player-error' });
      }
    } catch {
      toast.error('Não foi possível alterar a reprodução.');
    } finally {
      setIsControlling(false);
    }
  };

  const handleNext = async () => {
    if (!token) return;
    setIsControlling(true);
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/next', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 204) {
        setTimeout(fetchPlayback, 600);
      } else if (res.status === 403 || res.status === 404) {
        toast.error('Abra o app do Spotify no seu celular ou computador para trocar de faixa.', { id: 'player-error' });
      }
    } catch {
      toast.error('Erro ao pular de música.');
    } finally {
      setIsControlling(false);
    }
  };

  const handlePrevious = async () => {
    if (!token) return;
    setIsControlling(true);
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/previous', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 204) {
        setTimeout(fetchPlayback, 600);
      } else if (res.status === 403 || res.status === 404) {
        toast.error('Abra o app do Spotify no seu celular ou computador para voltar de faixa.', { id: 'player-error' });
      }
    } catch {
      toast.error('Erro ao voltar faixa.');
    } finally {
      setIsControlling(false);
    }
  };

  const progressPercent = durationMs > 0 ? Math.min((progressMs / durationMs) * 100, 100) : 0;
  const currentTrack = playback?.item;

  return (
    <footer className="h-20 bg-dark-surface/95 backdrop-blur-md border-t border-gray-800/80 px-6 flex items-center justify-between text-white select-none z-30 flex-shrink-0 transition-colors">
      {/* Lado Esquerdo: Capa e Detalhes da Faixa */}
      <div className="flex items-center gap-4 w-1/4 min-w-[200px]">
        {currentTrack ? (
          <>
            <div className="relative group w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800 border border-gray-700">
              <img
                src={currentTrack.album?.images?.[0]?.url || 'https://via.placeholder.com/64'}
                alt={currentTrack.name}
                className="w-full h-full object-cover"
              />
              {currentTrack.external_urls?.spotify && (
                <a
                  href={currentTrack.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Abrir no Spotify"
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-semibold text-sm truncate text-white hover:underline cursor-pointer" title={currentTrack.name}>
                {currentTrack.name}
              </span>
              <span className="text-xs text-gray-400 truncate" title={currentTrack.artists?.map((a: any) => a.name).join(', ')}>
                {currentTrack.artists?.map((a: any) => a.name).join(', ')}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 text-gray-400 text-xs">
            <div className="w-10 h-10 rounded-lg bg-dark-inner flex items-center justify-center border border-gray-800 text-gray-500">
              <Music2 size={18} />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-300">Nenhum som tocando</span>
              <span className="text-[11px] text-gray-500">Dê play no Spotify para sincronizar</span>
            </div>
          </div>
        )}
      </div>

      {/* Centro: Controles e Barra de Progresso */}
      <div className="flex flex-col items-center gap-1.5 w-2/4 max-w-xl">
        <div className="flex items-center gap-5">
          <button
            onClick={handlePrevious}
            disabled={!hasDevice || isControlling}
            title="Faixa Anterior"
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <SkipBack size={18} />
          </button>

          <button
            onClick={handleTogglePlay}
            disabled={!hasDevice || isControlling}
            title={isPlaying ? 'Pausar' : 'Reproduzir'}
            className="w-9 h-9 rounded-full bg-white text-black hover:scale-105 active:scale-95 flex items-center justify-center transition-transform disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPlaying ? <Pause size={18} className="fill-black" /> : <Play size={18} className="fill-black ml-0.5" />}
          </button>

          <button
            onClick={handleNext}
            disabled={!hasDevice || isControlling}
            title="Próxima Faixa"
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <SkipForward size={18} />
          </button>
        </div>

        {/* Linha de Tempo */}
        <div className="w-full flex items-center gap-3 text-[11px] text-gray-400">
          <span className="w-8 text-right font-mono">{formatTime(progressMs)}</span>
          <div className="flex-1 h-1.5 bg-gray-700/80 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-spotify-green rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="w-8 font-mono">{formatTime(durationMs)}</span>
        </div>
      </div>

      {/* Lado Direito: Dispositivo e Atualizar */}
      <div className="flex items-center justify-end gap-3 w-1/4 text-xs text-gray-400">
        {playback?.device && (
          <div className="flex items-center gap-1.5 bg-dark-inner/80 px-2.5 py-1 rounded-full border border-gray-700/60" title={`Dispositivo: ${playback.device.name}`}>
            <Laptop size={14} className="text-spotify-green" />
            <span className="truncate max-w-[120px] text-gray-300">{playback.device.name}</span>
          </div>
        )}
        <button
          onClick={fetchPlayback}
          title="Sincronizar status do Spotify agora"
          className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw size={15} />
        </button>
      </div>
    </footer>
  );
}
