const STOP_WORDS = new Set(['de', 'del', 'la', 'las', 'los', 'y'])

export function getMunicipalityMonogram(name) {
  const words = name
    .split(/\s+/)
    .filter((word) => word && !STOP_WORDS.has(word.toLowerCase()))

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase()
  }

  return name.slice(0, 2).toUpperCase()
}

export function normalizeSearchText(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function municipalityMatchesQuery(name, query) {
  if (!query) return true
  return normalizeSearchText(name).includes(normalizeSearchText(query))
}
