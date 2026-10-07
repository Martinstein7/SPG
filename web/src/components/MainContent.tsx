import { Search, Sparkles } from 'lucide-react';

export function MainContent() {
  return (
    <main className="flex-1 h-full overflow-y-auto p-10 bg-dark-base text-white">
      {/* Cabeçalho de Boas Vindas */}
      <div className="mb-12">
        <h2 className="text-4xl font-bold mb-2">Boas-vindas, Willian!</h2>
        <p className="text-gray-400 text-lg">O que você quer ouvir hoje?</p>
      </div>

      {/* Barra de Pesquisa / Prompt */}
      <div className="max-w-3xl mb-12">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-gray-400" size={20} />
          </div>
          <input 
            type="text" 
            className="w-full bg-dark-surface border border-gray-700 text-white rounded-xl py-4 pl-12 pr-40 focus:outline-none focus:border-primary-purple focus:ring-1 focus:ring-primary-purple transition-all text-lg"
            placeholder="Ex: Crie uma playlist para um vampiro melancólico..."
          />
          <button className="absolute inset-y-2 right-2 bg-primary-purple hover:bg-opacity-90 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-all">
            <Sparkles size={18} />
            Gerar Playlist
          </button>
        </div>
        
        {/* Chips de Exemplo */}
        <div className="flex flex-wrap items-center gap-3 mt-4 text-sm">
          <span className="text-gray-400">Exemplos:</span>
          {['Vampiro', 'Dirigindo de madrugada', 'TSL + Deftones + HIM', 'Rock alternativo', 'Anos 2000'].map((ex) => (
            <button key={ex} className="px-3 py-1.5 rounded-full border border-gray-700 bg-dark-surface hover:border-gray-500 text-gray-300 transition-colors">
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Suas Playlists */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">Suas playlists</h3>
          <button className="text-sm text-gray-400 hover:text-white transition-colors">Ver todas &rarr;</button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {/* Cards Mockados */}
          {[
            { name: 'TSL', tracks: '43 músicas', desc: 'Privada' },
            { name: 'HIM', tracks: '28 músicas', desc: 'Privada' },
            { name: 'Rock', tracks: '62 músicas', desc: 'Privada' },
            { name: 'Academia', tracks: '37 músicas', desc: 'Privada' },
            { name: 'Synthwave', tracks: '50 músicas', desc: 'Privada' },
          ].map((pl, i) => (
            <div key={i} className="bg-dark-surface p-4 rounded-xl hover:bg-[#252033] transition-colors cursor-pointer group">
              <div className="aspect-square bg-gray-800 rounded-lg mb-4 overflow-hidden">
                {/* Aqui entraria a imagem da playlist da API */}
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 group-hover:scale-105 transition-transform"></div>
              </div>
              <h4 className="font-bold text-white mb-1 truncate">{pl.name}</h4>
              <p className="text-xs text-gray-400">{pl.tracks} • {pl.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
