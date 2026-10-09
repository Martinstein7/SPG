import { useState } from 'react';
import { Settings, Sliders, Sparkles, LogOut, Palette } from 'lucide-react';
import toast from 'react-hot-toast';

export function SettingsView() {
  const [bgColor, setBgColor] = useState(localStorage.getItem('theme_dark_base') || '#0E0B14');
  const [titleColor, setTitleColor] = useState(localStorage.getItem('theme_text_title') || '#ffffff');
  const [primaryColor, setPrimaryColor] = useState(localStorage.getItem('theme_primary_purple') || '#6C5CE7');
  const [surfaceColor, setSurfaceColor] = useState(localStorage.getItem('theme_dark_surface') || '#1A1625');
  const [innerColor, setInnerColor] = useState(localStorage.getItem('theme_dark_inner') || '#110e19');

  const handleSave = () => {
    localStorage.setItem('theme_dark_base', bgColor);
    localStorage.setItem('theme_text_title', titleColor);
    localStorage.setItem('theme_primary_purple', primaryColor);
    localStorage.setItem('theme_dark_surface', surfaceColor);
    localStorage.setItem('theme_dark_inner', innerColor);
    
    document.documentElement.style.setProperty('--theme-dark-base', bgColor);
    document.documentElement.style.setProperty('--theme-text-title', titleColor);
    document.documentElement.style.setProperty('--theme-primary-purple', primaryColor);
    document.documentElement.style.setProperty('--theme-dark-surface', surfaceColor);
    document.documentElement.style.setProperty('--theme-dark-inner', innerColor);
    
    toast.success("Configurações salvas com sucesso!");
  };

  const handleDiscard = () => {
    setBgColor(localStorage.getItem('theme_dark_base') || '#0E0B14');
    setTitleColor(localStorage.getItem('theme_text_title') || '#ffffff');
    setPrimaryColor(localStorage.getItem('theme_primary_purple') || '#6C5CE7');
    setSurfaceColor(localStorage.getItem('theme_dark_surface') || '#1A1625');
    setInnerColor(localStorage.getItem('theme_dark_inner') || '#110e19');
  };
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
              <select className="w-full bg-dark-inner border border-gray-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-primary-purple outline-none">
                <option value="10">Curta (10 músicas)</option>
                <option value="15" selected>Ideal (15 músicas)</option>
                <option value="30">Longa (30 músicas)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nível de Obscuridade
              </label>
              <select className="w-full bg-dark-inner border border-gray-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-primary-purple outline-none">
                <option value="hits">Apenas Hits (Músicas Famosas)</option>
                <option value="balanced" selected>Equilibrado (Famosas e Desconhecidas)</option>
                <option value="underground">Underground (Descobrir artistas novos)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Bloco 2: Estilo */}
        <section className="bg-dark-surface p-6 rounded-xl border border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="text-primary-purple" size={24} />
            <h3 className="text-xl font-bold">Estilo Visual</h3>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-dark-inner rounded-lg border border-gray-700">
              <div>
                <h4 className="font-bold">Cor de Fundo (App)</h4>
                <p className="text-xs text-gray-400">Altere a cor de fundo geral.</p>
              </div>
              <input 
                type="color" 
                value={bgColor} 
                onChange={(e) => setBgColor(e.target.value)}
                className="w-12 h-12 rounded cursor-pointer bg-transparent border-0 p-0"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-dark-inner rounded-lg border border-gray-700">
              <div>
                <h4 className="font-bold">Cor dos Painéis</h4>
                <p className="text-xs text-gray-400">Altere a cor externa dos blocos (mais clara).</p>
              </div>
              <input 
                type="color" 
                value={surfaceColor} 
                onChange={(e) => setSurfaceColor(e.target.value)}
                className="w-12 h-12 rounded cursor-pointer bg-transparent border-0 p-0"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-dark-inner rounded-lg border border-gray-700">
              <div>
                <h4 className="font-bold">Cor Interna (Itens)</h4>
                <p className="text-xs text-gray-400">Altere a cor interna de cada configuração.</p>
              </div>
              <input 
                type="color" 
                value={innerColor} 
                onChange={(e) => setInnerColor(e.target.value)}
                className="w-12 h-12 rounded cursor-pointer bg-transparent border-0 p-0"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-dark-inner rounded-lg border border-gray-700">
              <div>
                <h4 className="font-bold">Cor dos Títulos</h4>
                <p className="text-xs text-gray-400">Altere a cor de títulos e textos de destaque.</p>
              </div>
              <input 
                type="color" 
                value={titleColor} 
                onChange={(e) => setTitleColor(e.target.value)}
                className="w-12 h-12 rounded cursor-pointer bg-transparent border-0 p-0"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-dark-inner rounded-lg border border-gray-700">
              <div>
                <h4 className="font-bold">Cor Principal (Destaques)</h4>
                <p className="text-xs text-gray-400">Altere a cor usada em botões e ícones (Padrão: Roxo).</p>
              </div>
              <input 
                type="color" 
                value={primaryColor} 
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-12 rounded cursor-pointer bg-transparent border-0 p-0"
              />
            </div>
          </div>
        </section>

        {/* Bloco 3: Integração Spotify */}
        <section className="bg-dark-surface p-6 rounded-xl border border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <Sliders className="text-spotify-green" size={24} />
            <h3 className="text-xl font-bold">Avançado</h3>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-dark-inner rounded-lg border border-gray-700">
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
          <button 
            onClick={handleDiscard}
            className="px-6 py-3 rounded-lg font-bold text-gray-400 hover:text-white transition-colors"
          >
            Descartar
          </button>
          <button 
            className="bg-primary-purple hover:bg-opacity-90 text-white font-bold py-3 px-8 rounded-lg transition-colors"
            onClick={handleSave}
          >
            Salvar Preferências
          </button>
        </div>

      </div>
    </main>
  );
}

