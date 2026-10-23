import { getCatalogThemeClass, paletteToCssVars } from '../../lib/catalogThemes'

export default function CatalogThemeScope({ theme, palette = null, className = '', children }) {
  const themeClass = getCatalogThemeClass(theme)
  const style = palette ? paletteToCssVars(palette, theme) : undefined

  return (
    <div className={`catalog-theme-scope ${themeClass} ${className}`.trim()} style={style}>
      {children}
    </div>
  )
}
