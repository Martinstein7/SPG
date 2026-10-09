import { Settings, Sliders, Sparkles, LogOut } from 'lucide-react';

export function SettingsView() {
  return (
    <main className="flex-1 h-full overflow-y-auto p-10 bg-dark-base text-white">
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2">Configurações</h2>
        <p className="text-gray-400 text-lg">Ajuste suas preferências de geração de playlists.</p>
      </div>
      
      <div className="max-w-3xl space-y-8">
        
        {/* Bloco 1: Preferências de IA */}
        <section className="bg-dark-surface p-6 rounded-xl border border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="text-primary-purple" size={24} />
            <h3 className="text-xl font-bold">Comportamento da IA</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tamanho Padrão da Playlist
              </label>
              <select className="w-full bg-[#110e19] border border-gray-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-primary-purple outline-none">
                <option value="10">Curta (10 músicas)</option>
                <option value="15" selected>Ideal (15 músicas)</option>
                <option value="30">Longa (30 músicas)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nível de Obscuridade
              </label>
              <select className="w-full bg-[#110e19] border border-gray-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-primary-purple outline-none">
                <option value="hits">Apenas Hits (Músicas Famosas)</option>
                <option value="balanced" selected>Equilibrado (Famosas e Desconhecidas)</option>
                <option value="underground">Underground (Descobrir artistas novos)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Bloco 2: Integração Spotify */}
        <section className="bg-dark-surface p-6 rounded-xl border border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <Sliders className="text-spotify-green" size={24} />
            <h3 className="text-xl font-bold">Avançado</h3>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-[#110e19] rounded-lg border border-gray-700">
            <div>
              <h4 className="font-bold">Playlists Públicas</h4>
              <p className="text-xs text-gray-400">As playlists geradas ficarão visíveis no seu perfil do Spotify.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-spotify-green"></div>
            </label>
          </div>
        </section>

        {/* Bloco de Ação */}
        <div className="pt-4 flex justify-end gap-4">
          <button className="px-6 py-3 rounded-lg font-bold text-gray-400 hover:text-white transition-colors">
            Descartar
          </button>
          <button 
            className="bg-primary-purple hover:bg-opacity-90 text-white font-bold py-3 px-8 rounded-lg transition-colors"
            onClick={() => alert("As configurações serão salvas e usadas na próxima geração!")}
          >
            Salvar Preferências
          </button>
        </div>

      </div>
    </main>
  );
}

