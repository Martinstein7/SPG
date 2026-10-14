import { Home, ListMusic, History, Settings } from 'lucide-react';

interface MobileNavProps {
  currentView: 'home' | 'playlists' | 'history' | 'settings';
  setCurrentView: (view: 'home' | 'playlists' | 'history' | 'settings') => void;
}

export function MobileNav({ currentView, setCurrentView }: MobileNavProps) {
  const navItems = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'playlists', label: 'Playlists', icon: ListMusic },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ] as const;

  return (
    <nav className="md:hidden bg-dark-surface/98 backdrop-blur-lg border-t border-gray-800/90 px-2 py-1.5 flex items-center justify-around z-40 flex-shrink-0 select-none pb-[max(0.375rem,env(safe-area-inset-bottom))]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all ${
              isActive
                ? 'text-white font-bold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className={`p-1 rounded-full transition-colors ${isActive ? 'bg-primary-purple/25 text-primary-purple' : ''}`}>
              <Icon size={20} className={isActive ? 'text-primary-purple stroke-[2.5]' : 'stroke-[1.8]'} />
            </div>
            <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'text-white font-bold' : 'text-gray-400'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

