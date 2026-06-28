import { getCatalogThemeClass } from '../../lib/catalogThemes'

export default function CatalogThemeScope({ theme, className = '', children }) {
  const themeClass = getCatalogThemeClass(theme)

  return (
    <div className={`catalog-theme-scope ${themeClass} ${className}`.trim()}>
      {children}
    </div>
  )
}
