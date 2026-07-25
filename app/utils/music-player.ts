const MUSIC_SOURCE = '/assets/music/starboy.mp3'

let musicPlayer: HTMLAudioElement | null = null

/** Returns the one client-side audio element shared by Music and Control Center. */
export function getMusicPlayer(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null

  if (!musicPlayer) {
    musicPlayer = new Audio(MUSIC_SOURCE)
    musicPlayer.loop = true
    musicPlayer.preload = 'metadata'
  }

  return musicPlayer
}
