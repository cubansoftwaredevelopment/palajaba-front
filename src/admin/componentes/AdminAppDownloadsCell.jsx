function platformLabel(platform) {
  if (platform === 'ios') return 'iOS'
  if (platform === 'android') return 'Android'
  return String(platform || '').trim() || 'App'
}

export function formatAppDownloadsText(downloads) {
  if (!Array.isArray(downloads) || !downloads.length) return '—'
  return downloads
    .map((item) => {
      const version = String(item?.version || '').trim()
      const label = platformLabel(item?.platform)
      return version ? `${label} ${version}` : label
    })
    .join(' · ')
}

export default function AdminAppDownloadsCell({ downloads }) {
  if (!Array.isArray(downloads) || !downloads.length) {
    return <span className="text-zinc-500">—</span>
  }

  return (
    <div className="flex flex-col gap-1.5">
      {downloads.map((item) => {
        const platform = String(item?.platform || '').trim().toLowerCase()
        const version = String(item?.version || '').trim()
        const key = `${platform}-${version}`
        return (
          <div key={key} className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-md border border-brand-green/20 bg-brand-green/10 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-brand-green">
              {platformLabel(platform)}
            </span>
            {version ? (
              <span className="font-mono text-xs tabular-nums text-zinc-200">{version}</span>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
