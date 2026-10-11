import { useState } from 'react';
import { Sliders, Sparkles, Palette } from 'lucide-react';
import toast from 'react-hot-toast';

export function SettingsView() {
  const [bgColor, setBgColor] = useState(localStorage.getItem('theme_dark_base') || '#0E0B14');
  const [titleColor, setTitleColor] = useState(localStorage.getItem('theme_text_title') || '#ffffff');
  const [primaryColor, setPrimaryColor] = useState(localStorage.getItem('theme_primary_purple') || '#6C5CE7');
  const [surfaceColor, setSurfaceColor] = useState(localStorage.getItem('theme_dark_surface') || '#1A1625');
  const [innerColor, setInnerColor] = useState(localStorage.getItem('theme_dark_inner') || '#110e19');
  const [defaultTrackCount, setDefaultTrackCount] = useState(localStorage.getItem('default_track_count') || '20');

  const [bgType, setBgType] = useState<'solid' | 'image' | 'ai'>(localStorage.getItem('theme_bg_type') as any || 'solid');
  const [bgImage, setBgImage] = useState<string>(localStorage.getItem('theme_bg_image') || '');
  const [bgAIPrompt, setBgAIPrompt] = useState<string>('');
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Redimensionar e comprimir via Canvas para caber com folga no localStorage (~5MB)
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setBgImage(compressedDataUrl);
          setBgType('image');
          toast.success("Imagem carregada e otimizada!");
        }
      };
      img.onerror = () => {
        toast.error("Erro ao carregar imagem.");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateAIBg = () => {
    if (!bgAIPrompt.trim()) return;
    setIsGeneratingBg(true);

    // Pollinations AI gera imagens em alta resolução em tempo real a partir do prompt
    const cleanPrompt = bgAIPrompt.trim().replace(/[^\w\s\u00C0-\u017F]/gi, ' ');
    const aiImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=1920&height=1080&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;

    const testImg = new Image();
    testImg.onload = () => {
      setBgImage(aiImageUrl);
      setBgType('ai');
      setIsGeneratingBg(false);
      toast.success("Background gerado por IA com sucesso!");
    };
    testImg.onerror = () => {
      // Fallback temático
      const fallbackUrl = `https://picsum.photos/1920/1080?blur=2`;
      setBgImage(fallbackUrl);
      setBgType('ai');
      setIsGeneratingBg(false);
      toast.success("Background temático aplicado!");
    };
    testImg.src = aiImageUrl;
  };

  const handleSave = () => {
    try {
      localStorage.setItem('theme_dark_base', bgColor);
      localStorage.setItem('theme_text_title', titleColor);
      localStorage.setItem('theme_primary_purple', primaryColor);
      localStorage.setItem('theme_dark_surface', surfaceColor);
      localStorage.setItem('theme_dark_inner', innerColor);
      localStorage.setItem('default_track_count', defaultTrackCount);
      localStorage.setItem('theme_bg_type', bgType);
      
      if ((bgType === 'image' || bgType === 'ai') && bgImage) {
        localStorage.setItem('theme_bg_image', bgImage);
        document.documentElement.style.setProperty('--theme-bg-image', `url("${bgImage}")`);
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
    } catch (e: any) {
      console.error("Erro ao salvar configurações:", e);
      toast.error("Erro ao salvar! O armazenamento local do navegador pode estar cheio.");
    }
  };

  const handleDiscard = () => {
    setBgColor(localStorage.getItem('theme_dark_base') || '#0E0B14');
    setTitleColor(localStorage.getItem('theme_text_title') || '#ffffff');
    setPrimaryColor(localStorage.getItem('theme_primary_purple') || '#6C5CE7');
    setSurfaceColor(localStorage.getItem('theme_dark_surface') || '#1A1625');
    setInnerColor(localStorage.getItem('theme_dark_inner') || '#110e19');
    setDefaultTrackCount(localStorage.getItem('default_track_count') || '20');
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
              <select 
                value={defaultTrackCount}
                onChange={(e) => setDefaultTrackCount(e.target.value)}
                className="w-full bg-dark-inner border border-gray-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-primary-purple outline-none"
              >
                <option value="10">Curta (10 músicas)</option>
                <option value="15">Padrão (15 músicas)</option>
                <option value="20">Ideal (20 músicas)</option>
                <option value="30">Longa (30 músicas)</option>
                <option value="50">Completa (50 músicas)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nível de Obscuridade
              </label>
              <select defaultValue="balanced" className="w-full bg-dark-inner border border-gray-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-primary-purple outline-none">
                <option value="hits">Apenas Hits (Músicas Famosas)</option>
                <option value="balanced">Equilibrado (Famosas e Desconhecidas)</option>
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

              {bgImage && bgType !== 'solid' && (
                <div className="mt-4 p-3 bg-dark-surface/60 rounded-lg border border-gray-700 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img 
                      src={bgImage} 
                      alt="Prévia do plano de fundo" 
                      className="w-20 h-12 object-cover rounded border border-gray-600 flex-shrink-0" 
                    />
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-white truncate">Imagem selecionada</p>
                      <p className="text-[11px] text-gray-400">Clique em "Salvar Preferências" abaixo para aplicar ao app</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBgImage('');
                      setBgType('solid');
                    }}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold px-2 py-1 rounded bg-red-950/40 border border-red-900/50 flex-shrink-0"
                  >
                    Remover
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

