import { ListMusic, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MobileHeaderProps {
  token: string | null;
}

export function MobileHeader({ token }: MobileHeaderProps) {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (token) {
      fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => setProfile(data))
        .catch(() => {});
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('spotify_token');
    window.location.reload();
  };

  return (
    <header className="md:hidden bg-dark-surface/95 backdrop-blur-md border-b border-gray-800/80 px-4 py-3 flex items-center justify-between text-white z-40 flex-shrink-0 select-none">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-spotify-green flex items-center justify-center">
          <ListMusic size={16} className="text-black" />
        </div>
        <span className="font-bold text-base tracking-tight text-white">Spotify AI Playlist</span>
      </div>

      {profile && (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gray-700 overflow-hidden border border-gray-700 flex-shrink-0">
            <img
              src={
                profile.images?.[0]?.url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.display_name || 'U')}&background=1DB954&color=fff`
              }
              alt={profile.display_name || 'Usuário'}
              className="w-full h-full object-cover"
            />
          </div>
          <button
            onClick={handleLogout}
            title="Sair da conta"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      )}
    </header>
  );
}

