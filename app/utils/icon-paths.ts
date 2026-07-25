const NEW_ICON_STYLE_BASE_PATH = '/assets/new%20icon%20style'
const MACWEB_ICON_BASE_PATH = '/assets/macweb-icons'

export const macwebAppIconSrc = {
  finder: {
    dark: `${MACWEB_ICON_BASE_PATH}/Finder_Dark.png`,
    light: `${MACWEB_ICON_BASE_PATH}/Finder.png`,
  },
  settings: {
    dark: `${MACWEB_ICON_BASE_PATH}/Settings_Dark.png`,
    light: `${MACWEB_ICON_BASE_PATH}/settings_1.png`,
  },
} as const

export const macwebSettingsSectionIconSrc = {
  general: macwebAppIconSrc.settings.light,
  appearance: `${MACWEB_ICON_BASE_PATH}/settings-sections/Appearance.png`,
  wallpaper: `${MACWEB_ICON_BASE_PATH}/settings-sections/Wallpapers.png`,
} as const

export const newIconSrc = {
  calculator: `${NEW_ICON_STYLE_BASE_PATH}/Calculator26.svg`,
  contact: `${NEW_ICON_STYLE_BASE_PATH}/Contacts26.svg`,
  finder: macwebAppIconSrc.finder.light,
  folder: `${NEW_ICON_STYLE_BASE_PATH}/Folder26.svg`,
  messages: `${NEW_ICON_STYLE_BASE_PATH}/Messages26.svg`,
  notes: `${NEW_ICON_STYLE_BASE_PATH}/Notes26.svg`,
  safari: `${NEW_ICON_STYLE_BASE_PATH}/Safari26.svg`,
  settings: macwebAppIconSrc.settings.light,
  terminal: `${NEW_ICON_STYLE_BASE_PATH}/terminal26.svg`,
  trash: `${NEW_ICON_STYLE_BASE_PATH}/Trash26empty.svg`,
} as const
