/**
 * Spotify links used as soundtrack: a playlist, album, track… played on the TV
 * through Spotify's embed player. Full tracks play when that browser is logged
 * into Spotify; otherwise Spotify only serves 30-second previews.
 */
export const SPOTIFY_TYPES = ["playlist", "album", "track", "artist", "episode", "show"] as const;

export type SpotifyType = (typeof SPOTIFY_TYPES)[number];

export interface SpotifyItem {
  type: SpotifyType;
  id: string;
}

const LINK = /^https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}(?:-[a-z]{2})?\/)?(?:embed\/)?([a-z]+)\/([A-Za-z0-9]{22})(?:[/?#].*)?$/i;
const URI = /^spotify:([a-z]+):([A-Za-z0-9]{22})$/i;

/** Accepts a "Share → Copy link" URL (with or without ?si=…) or a spotify: URI. */
export function parseSpotify(input: string): SpotifyItem | null {
  const match = input.trim().match(LINK) ?? input.trim().match(URI);
  if (!match) return null;
  const type = match[1].toLowerCase() as SpotifyType;
  if (!SPOTIFY_TYPES.includes(type)) return null;
  return { type, id: match[2] };
}

export function isSpotifyUrl(url: string): boolean {
  return parseSpotify(url) !== null;
}

export function spotifyUrl(item: SpotifyItem): string {
  return `https://open.spotify.com/${item.type}/${item.id}`;
}

export function spotifyUri(item: SpotifyItem): string {
  return `spotify:${item.type}:${item.id}`;
}
