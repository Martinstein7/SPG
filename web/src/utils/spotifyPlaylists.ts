/**
 * Utilitários para busca paginada e contagem correta de faixas em playlists do Spotify
 */

export const getPlaylistTrackCount = (pl: any): number => {
  if (!pl) return 0;
  if (typeof pl.tracks?.total === 'number' && pl.tracks.total > 0) return pl.tracks.total;
  if (typeof pl.items?.total === 'number' && pl.items.total > 0) return pl.items.total;
  if (typeof pl.total === 'number' && pl.total > 0) return pl.total;
  if (typeof pl.total_tracks === 'number' && pl.total_tracks > 0) return pl.total_tracks;
  if (typeof pl.tracks_total === 'number' && pl.tracks_total > 0) return pl.tracks_total;
  if (Array.isArray(pl.tracks) && pl.tracks.length > 0) return pl.tracks.length;
  if (Array.isArray(pl.items) && pl.items.length > 0) return pl.items.length;
  if (typeof pl.tracks?.total === 'number') return pl.tracks.total;
  return 0;
};

export const isPlaylistEditable = (pl: any, userProfile: any): boolean => {
  if (!pl) return false;
  // Playlists colaborativas são editáveis
  if (pl.collaborative) return true;
  if (pl.can_edit) return true;
  if (!userProfile) return true;

  const ownerId = pl.owner?.id?.toLowerCase();
  const userId = userProfile.id?.toLowerCase();
  if (ownerId && userId && ownerId === userId) return true;

  if (pl.owner?.uri && userProfile.uri && pl.owner.uri === userProfile.uri) return true;

  const ownerName = pl.owner?.display_name?.toLowerCase();
  const userName = userProfile.display_name?.toLowerCase();
  if (ownerName && userName && ownerName === userName) return true;

  return false;
};

/**
 * Busca todas as playlists do usuário iterando por páginas da API do Spotify (limite padrão é 50 por chamada)
 */
export async function fetchAllUserPlaylists(token: string, userProfile: any): Promise<any[]> {
  let allItems: any[] = [];
  let nextUrl: string | null = 'https://api.spotify.com/v1/me/playlists?limit=50';

  try {
    while (nextUrl) {
      const res = await fetch(nextUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) break;
      const data = await res.json();
      if (data.items && Array.isArray(data.items)) {
        allItems = allItems.concat(data.items);
      }
      nextUrl = data.next || null;
      if (allItems.length >= 300) break; // Trava de segurança
    }
  } catch (err) {
    console.error("Erro ao paginar playlists do Spotify:", err);
  }

  // Filtrar apenas as controladas ou colaborativas
  return allItems.filter((pl) => isPlaylistEditable(pl, userProfile));
}

/**
 * Para playlists que a listagem simplificada do Spotify indica 0 faixas, busca o total real via endpoint individual
 */
export async function enrichPlaylistTrackCounts(
  playlists: any[],
  token: string,
  onBatchUpdated: (updatedList: any[]) => void
) {
  const needsEnrichment = playlists.filter((pl) => getPlaylistTrackCount(pl) === 0);
  if (needsEnrichment.length === 0) return;

  const updatedCounts = new Map<string, number>();

  // Processa em lotes de 5 requisições paralelas para atualizar a UI sem travar
  for (let i = 0; i < needsEnrichment.length; i += 5) {
    const batch = needsEnrichment.slice(i, i + 5);
    await Promise.all(
      batch.map(async (pl) => {
        try {
          const res = await fetch(`https://api.spotify.com/v1/playlists/${pl.id}?fields=tracks.total`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const realTotal = data.tracks?.total ?? data.total ?? 0;
            if (realTotal > 0) {
              updatedCounts.set(pl.id, realTotal);
            }
          }
        } catch {
          // Ignora falhas pontuais
        }
      })
    );

    if (updatedCounts.size > 0) {
      const updatedList = playlists.map((pl) => {
        if (updatedCounts.has(pl.id)) {
          return {
            ...pl,
            tracks: { ...(pl.tracks || {}), total: updatedCounts.get(pl.id) }
          };
        }
        return pl;
      });
      onBatchUpdated(updatedList);
    }
  }
}

const CUSTOM_COVERS_STORAGE_KEY = 'spg_custom_covers';

export function saveCustomPlaylistCover(playlistId: string, coverUrl: string) {
  if (!playlistId || !coverUrl) return;
  try {
    const raw = sessionStorage.getItem(CUSTOM_COVERS_STORAGE_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    map[playlistId] = coverUrl;
    sessionStorage.setItem(CUSTOM_COVERS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage limits
  }
}

export function getPlaylistCoverUrl(pl: any): string | null {
  if (!pl) return null;
  if (pl.customCoverUrl) return pl.customCoverUrl;
  try {
    const raw = sessionStorage.getItem(CUSTOM_COVERS_STORAGE_KEY);
    if (raw && pl.id) {
      const map: Record<string, string> = JSON.parse(raw);
      if (map[pl.id]) return map[pl.id];
    }
  } catch {
    // Ignore
  }
  if (pl.images && pl.images.length > 0 && pl.images[0]?.url) {
    return pl.images[0].url;
  }
  return null;
}


