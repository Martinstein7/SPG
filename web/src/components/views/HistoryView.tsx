import { History } from 'lucide-react';

export function HistoryView() {
  return (
    <main className="flex-1 h-full overflow-y-auto p-10 bg-dark-base text-white">
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2">Histórico</h2>
        <p className="text-gray-400 text-lg">Suas playlists geradas recentemente pela IA.</p>
      </div>
      
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-dark-surface rounded-xl border border-gray-800">
        <History size={48} className="mb-4 opacity-50" />
        <p>O histórico de playlists geradas aparecerá aqui em breve.</p>
      </div>
    </main>
  );
}

