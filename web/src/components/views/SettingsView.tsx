import { useState } from 'react';
import { Sliders, Sparkles, Palette, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const PRESET_THEMES = [
  {
    name: 'Roxo Original',
    bg: '#0E0B14',
    surface: '#1A1625',
    inner: '#110e19',
    primary: '#6C5CE7',
    title: '#ffffff'
  },
  {
    name: 'Spotify Black',
    bg: '#090909',
    surface: '#121212',
    inner: '#181818',
    primary: '#1DB954',
    title: '#ffffff'
  },
  {
    name: 'Oceano Noturno',
    bg: '#070F1B',
    surface: '#0F1E33',
    inner: '#0A1526',
    primary: '#38BDF8',
    title: '#F0F9FF'
  },
  {
    name: 'Vampiro Carmesim',
    bg: '#120709',
    surface: '#220D12',
    inner: '#17090C',
    primary: '#E11D48',
    title: '#FFE4E6'
  },
  {
    name: 'Cyberpunk Gold',
    bg: '#0D0C06',
    surface: '#1C190B',
    inner: '#141208',
    primary: '#F59E0B',
    title: '#FEF3C7'
  }
];

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

  const applyThemeColorsLive = (colors: {
    bg: string;
    surface: string;
    inner: string;
    primary: string;
    title: string;
  }) => {
    document.documentElement.style.setProperty('--theme-dark-base', colors.bg);
    document.documentElement.style.setProperty('--theme-dark-surface', colors.surface);
    document.documentElement.style.setProperty('--theme-dark-inner', colors.inner);
    document.documentElement.style.setProperty('--theme-primary-purple', colors.primary);
    document.documentElement.style.setProperty('--theme-text-title', colors.title);
  };

  const handleApplyPreset = (preset: typeof PRESET_THEMES[0]) => {
    setBgColor(preset.bg);
    setSurfaceColor(preset.surface);
    setInnerColor(preset.inner);
    setPrimaryColor(preset.primary);
    setTitleColor(preset.title);
    setBgType('solid');
    setBgImage('');

    applyThemeColorsLive(preset);
    document.documentElement.style.setProperty('--theme-bg-image', 'none');

    localStorage.setItem('theme_dark_base', preset.bg);
    localStorage.setItem('theme_dark_surface', preset.surface);
    localStorage.setItem('theme_dark_inner', preset.inner);
    localStorage.setItem('theme_primary_purple', preset.primary);
    localStorage.setItem('theme_text_title', preset.title);
    localStorage.setItem('theme_bg_type', 'solid');
    localStorage.removeItem('theme_bg_image');

    toast.success(`Tema "${preset.name}" aplicado!`);
  };

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
          document.documentElement.style.setProperty('--theme-bg-image', `url("${compressedDataUrl}")`);
          toast.success("Imagem carregada! Clique em Salvar Preferências para fixar.");
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
      document.documentElement.style.setProperty('--theme-bg-image', `url("${aiImageUrl}")`);
      toast.success("Background gerado por IA com sucesso!");
    };
    testImg.onerror = () => {
      // Fallback temático
      const fallbackUrl = `https://picsum.photos/1920/1080?blur=2`;
      setBgImage(fallbackUrl);
      setBgType('ai');
      setIsGeneratingBg(false);
      document.documentElement.style.setProperty('--theme-bg-image', `url("${fallbackUrl}")`);
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
      
      applyThemeColorsLive({
        bg: bgColor,
        surface: surfaceColor,
        inner: innerColor,
        primary: primaryColor,
        title: titleColor
      });
      
      toast.success("Configurações salvas com sucesso!");
    } catch (e: any) {
      console.error("Erro ao salvar configurações:", e);
      toast.error("Erro ao salvar! O armazenamento local do navegador pode estar cheio.");
    }
  };

  const handleDiscard = () => {
    const savedBg = localStorage.getItem('theme_dark_base') || '#0E0B14';
    const savedTitle = localStorage.getItem('theme_text_title') || '#ffffff';
    const savedPrimary = localStorage.getItem('theme_primary_purple') || '#6C5CE7';
    const savedSurface = localStorage.getItem('theme_dark_surface') || '#1A1625';
    const savedInner = localStorage.getItem('theme_dark_inner') || '#110e19';
    const savedBgType = (localStorage.getItem('theme_bg_type') as any) || 'solid';
    const savedBgImage = localStorage.getItem('theme_bg_image') || '';

    setBgColor(savedBg);
    setTitleColor(savedTitle);
    setPrimaryColor(savedPrimary);
    setSurfaceColor(savedSurface);
    setInnerColor(savedInner);
    setDefaultTrackCount(localStorage.getItem('default_track_count') || '20');
    setBgType(savedBgType);
    setBgImage(savedBgImage);

    applyThemeColorsLive({
      bg: savedBg,
      surface: savedSurface,
      inner: savedInner,
      primary: savedPrimary,
      title: savedTitle
    });
    if ((savedBgType === 'image' || savedBgType === 'ai') && savedBgImage) {
      document.documentElement.style.setProperty('--theme-bg-image', `url("${savedBgImage}")`);
    } else {
      document.documentElement.style.setProperty('--theme-bg-image', 'none');
    }
    toast("Alterações não salvas descartadas.");
  };

  return (
    <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 md:p-10 bg-transparent text-white">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">Configurações</h2>
        <p className="text-gray-400 text-sm sm:text-base md:text-lg">Ajuste suas preferências e personalize as cores do aplicativo.</p>
      </div>
      
      <div className="max-w-3xl space-y-6 sm:space-y-8">
        
        {/* Bloco 1: Preferências de IA */}
        <section className="bg-dark-surface p-4 sm:p-6 rounded-xl border border-gray-800">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <Sparkles className="text-primary-purple" size={22} />
            <h3 className="text-lg sm:text-xl font-bold">Comportamento da IA</h3>
          </div>
          
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                Tamanho Padrão da Playlist
              </label>
              <select 
                value={defaultTrackCount}
                onChange={(e) => setDefaultTrackCount(e.target.value)}
                className="w-full bg-dark-inner border border-gray-700 rounded-lg p-2.5 sm:p-3 text-white text-sm sm:text-base focus:ring-1 focus:ring-primary-purple outline-none"
              >
                <option value="10">Curta (10 músicas)</option>
                <option value="15">Padrão (15 músicas)</option>
                <option value="20">Ideal (20 músicas)</option>
                <option value="30">Longa (30 músicas)</option>
                <option value="50">Completa (50 músicas)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                Nível de Obscuridade
              </label>
              <select defaultValue="balanced" className="w-full bg-dark-inner border border-gray-700 rounded-lg p-2.5 sm:p-3 text-white text-sm sm:text-base focus:ring-1 focus:ring-primary-purple outline-none">
                <option value="hits">Apenas Hits (Músicas Famosas)</option>
                <option value="balanced">Equilibrado (Famosas e Desconhecidas)</option>
                <option value="underground">Underground (Descobrir artistas novos)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Bloco 2: Estilo */}
        <section className="bg-dark-surface p-4 sm:p-6 rounded-xl border border-gray-800">
          <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <Palette className="text-primary-purple" size={22} />
              <h3 className="text-lg sm:text-xl font-bold">Estilo Visual</h3>
            </div>
            <button
              type="button"
              onClick={() => handleApplyPreset(PRESET_THEMES[0])}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-dark-inner border border-gray-700 cursor-pointer"
            >
              <RotateCcw size={13} />
              Restaurar Padrão
            </button>
          </div>
          
          <div className="space-y-4 sm:space-y-6">
            {/* Temas Rápidos de 1 Toque (Ideal para Celular) */}
            <div className="p-3.5 sm:p-4 bg-dark-inner rounded-lg border border-gray-700">
              <h4 className="font-bold text-sm sm:text-base mb-1">Temas Rápidos (1 Toque)</h4>
              <p className="text-xs text-gray-400 mb-3">Toque em um tema abaixo para alterar todas as cores instantaneamente.</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {PRESET_THEMES.map((preset) => {
                  const isSelected = bgColor.toLowerCase() === preset.bg.toLowerCase() && primaryColor.toLowerCase() === preset.primary.toLowerCase() && bgType === 'solid';
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-2 ${
                        isSelected
                          ? 'border-white ring-1 ring-white bg-black/40'
                          : 'border-gray-700 hover:border-gray-500 bg-black/20'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: preset.bg }} />
                        <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: preset.surface }} />
                        <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: preset.primary }} />
                      </div>
                      <span className="text-xs font-bold text-white truncate">{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3.5 sm:p-4 bg-dark-inner rounded-lg border border-gray-700">
              <div className="mb-3 sm:mb-4">
                <h4 className="font-bold text-sm sm:text-base">Plano de Fundo</h4>
                <p className="text-xs text-gray-400">Escolha como deseja exibir o fundo do app.</p>
              </div>
              
              <div className="flex flex-wrap gap-3 sm:gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="bgType" value="solid" checked={bgType === 'solid'} onChange={() => setBgType('solid')} className="accent-primary-purple" />
                  <span className="text-xs sm:text-sm">Cor Sólida</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="bgType" value="image" checked={bgType === 'image'} onChange={() => setBgType('image')} className="accent-primary-purple" />
                  <span className="text-xs sm:text-sm">Enviar Imagem</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="bgType" value="ai" checked={bgType === 'ai'} onChange={() => setBgType('ai')} className="accent-primary-purple" />
                  <span className="text-xs sm:text-sm">Gerar com IA</span>
                </label>
              </div>

              {bgType === 'image' && (
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-800">
                  <p className="text-xs text-gray-400 mb-2">Envie uma imagem JPG ou PNG. Recomendado: 1920x1080 (se ajustará automaticamente).</p>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg" 
                    onChange={handleImageUpload}
                    className="block w-full text-xs sm:text-sm text-gray-400 file:mr-3 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-bold file:bg-primary-purple file:text-white hover:file:bg-opacity-90 cursor-pointer"
                  />
                  {bgImage && bgType === 'image' && <div className="mt-2 text-xs text-spotify-green">Imagem carregada e pronta para salvar.</div>}
                </div>
              )}

              {bgType === 'ai' && (
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-800 flex flex-col sm:flex-row gap-2">
                  <input 
                    type="text" 
                    value={bgAIPrompt} 
                    onChange={(e) => setBgAIPrompt(e.target.value)}
                    placeholder="Ex: floresta escura com neon roxo..."
                    className="flex-1 bg-dark-surface border border-gray-700 text-white rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-primary-purple"
                  />
                  <button 
                    onClick={handleGenerateAIBg}
                    disabled={isGeneratingBg || !bgAIPrompt}
                    className="bg-primary-purple hover:bg-opacity-90 text-white text-xs sm:text-sm font-bold py-2 px-4 rounded-lg disabled:bg-gray-700 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isGeneratingBg ? "Gerando..." : "Gerar"}
                  </button>
                </div>
              )}

              {bgImage && bgType !== 'solid' && (
                <div className="mt-4 p-3 bg-dark-surface/60 rounded-lg border border-gray-700 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden min-w-0">
                    <img 
                      src={bgImage} 
                      alt="Prévia do plano de fundo" 
                      className="w-16 h-10 sm:w-20 sm:h-12 object-cover rounded border border-gray-600 flex-shrink-0" 
                    />
                    <div className="overflow-hidden min-w-0">
                      <p className="text-xs font-semibold text-white truncate">Imagem selecionada</p>
                      <p className="text-[10px] sm:text-[11px] text-gray-400 truncate">Clique em "Salvar Preferências" abaixo para aplicar</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBgImage('');
                      setBgType('solid');
                      document.documentElement.style.setProperty('--theme-bg-image', 'none');
                    }}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold px-2.5 py-1 rounded bg-red-950/40 border border-red-900/50 flex-shrink-0 cursor-pointer"
                  >
                    Remover
                  </button>
                </div>
              )}
            </div>

            {bgType === 'solid' && (
              <div className="flex items-center justify-between p-3.5 sm:p-4 bg-dark-inner rounded-lg border border-gray-700 gap-3">
                <div className="min-w-0">
                  <h4 className="font-bold text-sm sm:text-base">Cor de Fundo (App)</h4>
                  <p className="text-xs text-gray-400">Altere a cor de fundo geral.</p>
                </div>
                <input 
                  type="color" 
                  value={bgColor} 
                  onChange={(e) => {
                    setBgColor(e.target.value);
                    document.documentElement.style.setProperty('--theme-dark-base', e.target.value);
                  }}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded cursor-pointer bg-transparent border-0 p-0 flex-shrink-0"
                />
              </div>
            )}

            <div className="flex items-center justify-between p-3.5 sm:p-4 bg-dark-inner rounded-lg border border-gray-700 gap-3">
              <div className="min-w-0">
                <h4 className="font-bold text-sm sm:text-base">Cor dos Painéis</h4>
                <p className="text-xs text-gray-400">Altere a cor externa dos blocos (mais clara).</p>
              </div>
              <input 
                type="color" 
                value={surfaceColor} 
                onChange={(e) => {
                  setSurfaceColor(e.target.value);
                  document.documentElement.style.setProperty('--theme-dark-surface', e.target.value);
                }}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded cursor-pointer bg-transparent border-0 p-0 flex-shrink-0"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 sm:p-4 bg-dark-inner rounded-lg border border-gray-700 gap-3">
              <div className="min-w-0">
                <h4 className="font-bold text-sm sm:text-base">Cor Interna (Itens)</h4>
                <p className="text-xs text-gray-400">Altere a cor interna de cada configuração.</p>
              </div>
              <input 
                type="color" 
                value={innerColor} 
                onChange={(e) => {
                  setInnerColor(e.target.value);
                  document.documentElement.style.setProperty('--theme-dark-inner', e.target.value);
                }}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded cursor-pointer bg-transparent border-0 p-0 flex-shrink-0"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 sm:p-4 bg-dark-inner rounded-lg border border-gray-700 gap-3">
              <div className="min-w-0">
                <h4 className="font-bold text-sm sm:text-base">Cor dos Títulos</h4>
                <p className="text-xs text-gray-400">Altere a cor de títulos e textos de destaque.</p>
              </div>
              <input 
                type="color" 
                value={titleColor} 
                onChange={(e) => {
                  setTitleColor(e.target.value);
                  document.documentElement.style.setProperty('--theme-text-title', e.target.value);
                }}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded cursor-pointer bg-transparent border-0 p-0 flex-shrink-0"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 sm:p-4 bg-dark-inner rounded-lg border border-gray-700 gap-3">
              <div className="min-w-0">
                <h4 className="font-bold text-sm sm:text-base">Cor Principal (Destaques)</h4>
                <p className="text-xs text-gray-400">Altere a cor usada em botões e ícones (Padrão: Roxo).</p>
              </div>
              <input 
                type="color" 
                value={primaryColor} 
                onChange={(e) => {
                  setPrimaryColor(e.target.value);
                  document.documentElement.style.setProperty('--theme-primary-purple', e.target.value);
                }}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded cursor-pointer bg-transparent border-0 p-0 flex-shrink-0"
              />
            </div>
          </div>
        </section>

        {/* Bloco 3: Integração Spotify */}
        <section className="bg-dark-surface p-4 sm:p-6 rounded-xl border border-gray-800">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <Sliders className="text-spotify-green" size={22} />
            <h3 className="text-lg sm:text-xl font-bold">Avançado</h3>
          </div>
          
          <div className="flex items-center justify-between p-3.5 sm:p-4 bg-dark-inner rounded-lg border border-gray-700 gap-3">
            <div className="min-w-0">
              <h4 className="font-bold text-sm sm:text-base">Playlists Públicas</h4>
              <p className="text-xs text-gray-400">As playlists geradas ficarão visíveis no seu perfil do Spotify.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-spotify-green"></div>
            </label>
          </div>
        </section>

        {/* Bloco de Ação */}
        <div className="pt-2 sm:pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 pb-6 sm:pb-8">
          <button 
            onClick={handleDiscard}
            className="w-full sm:w-auto px-6 py-3 rounded-lg font-bold text-gray-400 hover:text-white transition-colors cursor-pointer text-center text-sm sm:text-base"
          >
            Descartar
          </button>
          <button 
            className="w-full sm:w-auto bg-primary-purple hover:bg-opacity-90 text-white font-bold py-3.5 sm:py-3 px-8 rounded-lg transition-colors cursor-pointer text-center text-sm sm:text-base"
            onClick={handleSave}
          >
            Salvar Preferências
          </button>
        </div>

      </div>
    </main>
  );
}


