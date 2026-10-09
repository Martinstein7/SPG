import { useState } from 'react';
import { Settings, Sliders, Sparkles, LogOut, Palette } from 'lucide-react';
import toast from 'react-hot-toast';

export function SettingsView() {
  const [bgColor, setBgColor] = useState(localStorage.getItem('theme_dark_base') || '#0E0B14');
  const [titleColor, setTitleColor] = useState(localStorage.getItem('theme_text_title') || '#ffffff');
  const [primaryColor, setPrimaryColor] = useState(localStorage.getItem('theme_primary_purple') || '#6C5CE7');
  const [surfaceColor, setSurfaceColor] = useState(localStorage.getItem('theme_dark_surface') || '#1A1625');
  const [innerColor, setInnerColor] = useState(localStorage.getItem('theme_dark_inner') || '#110e19');

  const [bgType, setBgType] = useState<'solid' | 'image' | 'ai'>(localStorage.getItem('theme_bg_type') as any || 'solid');
  const [bgImage, setBgImage] = useState<string>(localStorage.getItem('theme_bg_image') || '');
  const [bgAIPrompt, setBgAIPrompt] = useState<string>('');
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setBgImage(base64);
        setBgType('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAIBg = () => {
    if (!bgAIPrompt) return;
    setIsGeneratingBg(true);
    // Mock AI generation by using Unsplash source API with the prompt as keyword
    setTimeout(() => {
      const mockUrl = `https://source.unsplash.com/1920x1080/?${encodeURIComponent(bgAIPrompt)}`;
      setBgImage(mockUrl);
      setBgType('image');
      setIsGeneratingBg(false);
      toast.success("Background gerado por IA (Mock)!");
    }, 2000);
  };

  const handleSave = () => {
    localStorage.setItem('theme_dark_base', bgColor);
    localStorage.setItem('theme_text_title', titleColor);
    localStorage.setItem('theme_primary_purple', primaryColor);
    localStorage.setItem('theme_dark_surface', surfaceColor);
    localStorage.setItem('theme_dark_inner', innerColor);
    
    localStorage.setItem('theme_bg_type', bgType);
    if (bgType === 'image' && bgImage) {
      localStorage.setItem('theme_bg_image', bgImage);
      document.documentElement.style.setProperty('--theme-bg-image', `url(${bgImage})`);
    } else {
      localStorage.removeItem('theme_bg_image');
      document.documentElement.style.setProperty('--theme-bg-image', 'none');
    }
    
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
    setBgType((localStorage.getItem('theme_bg_type') as any) || 'solid');
    setBgImage(localStorage.getItem('theme_bg_image') || '');
  };
  return (
    <main className="flex-1 h-full overflow-y-auto p-10 bg-transparent text-white">
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
            
            <div className="p-4 bg-dark-inner rounded-lg border border-gray-700">
              <div className="mb-4">
                <h4 className="font-bold">Plano de Fundo</h4>
                <p className="text-xs text-gray-400">Escolha como deseja exibir o fundo do app.</p>
              </div>
              
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="bgType" value="solid" checked={bgType === 'solid'} onChange={() => setBgType('solid')} className="accent-primary-purple" />
                  <span className="text-sm">Cor Sólida</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="bgType" value="image" checked={bgType === 'image'} onChange={() => setBgType('image')} className="accent-primary-purple" />
                  <span className="text-sm">Enviar Imagem</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="bgType" value="ai" checked={bgType === 'ai'} onChange={() => setBgType('ai')} className="accent-primary-purple" />
                  <span className="text-sm">Gerar com IA</span>
                </label>
              </div>

              {bgType === 'image' && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <p className="text-xs text-gray-400 mb-2">Envie uma imagem JPG ou PNG. Recomendado: 1920x1080 (a imagem se ajustará automaticamente).</p>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg" 
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary-purple file:text-white hover:file:bg-opacity-90"
                  />
                  {bgImage && bgType === 'image' && <div className="mt-2 text-xs text-spotify-green">Imagem carregada (não esqueça de salvar).</div>}
                </div>
              )}

              {bgType === 'ai' && (
                <div className="mt-4 pt-4 border-t border-gray-800 flex gap-2">
                  <input 
                    type="text" 
                    value={bgAIPrompt} 
                    onChange={(e) => setBgAIPrompt(e.target.value)}
                    placeholder="Ex: floresta escura com neon roxo..."
                    className="flex-1 bg-dark-surface border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-purple"
                  />
                  <button 
                    onClick={handleGenerateAIBg}
                    disabled={isGeneratingBg || !bgAIPrompt}
                    className="bg-primary-purple hover:bg-opacity-90 text-white text-sm font-bold py-2 px-4 rounded-lg disabled:bg-gray-700 disabled:cursor-not-allowed"
                  >
                    {isGeneratingBg ? "Gerando..." : "Gerar"}
                  </button>
                </div>
              )}
            </div>

            {bgType === 'solid' && (
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
            )}

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

