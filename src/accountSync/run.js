import { drainOutbox, enqueueAccountSync, setAccountSyncRunner } from '../syncManager/index.js'
import { clearSyncNotice, showSyncFailedNotice, showSyncingNotice } from './notify.js'
import { compareSectionDates, pullSection, pushData, pushSection, ROLE_SECTIONS } from './sections.js'
import { accountIdFromToken, readAccount, sectionDate, writeAccount } from './store.js'

let active = null
let running = false

function remember(record, name, updatedAt, data) {
  record.sections[name] = { updatedAt: updatedAt || record.sections[name]?.updatedAt || null, data }
}

function mergedSection(local, saved) {
  if (saved?.data == null) return local?.data
  if (
    local?.data &&
    !Array.isArray(local.data) &&
    !Array.isArray(saved.data) &&
    typeof saved.data === 'object'
  ) {
    return { ...local.data, ...saved.data }
  }
  return saved.data
}

export async function syncAccount({ role, token, onAccount }) {
  const accountId = accountIdFromToken(token)
  if (!role || !token || !accountId) return null
  const record = (await readAccount(role, accountId)) || { sections: {} }
  record.sections ||= {}
  const dates = {}
  for (const name of ROLE_SECTIONS[role]) dates[name] = sectionDate(record, name)
  const verdicts = await compareSectionDates(role, token, dates)
  const pulling = ROLE_SECTIONS[role].some((name) => verdicts?.[name] === false || (verdicts?.[name] == null && record.sections[name]?.data == null))
  if (pulling) await showSyncingNotice()
  const bag = {}
  for (const name of ROLE_SECTIONS[role]) {
    const verdict = verdicts?.[name]
    const local = record.sections[name]
    if (verdict === true && local?.data != null) {
      const saved = await pushSection(role, token, name, local.updatedAt, pushData(role, name, local))
      remember(record, name, saved?.updated_at || local.updatedAt, mergedSection(local, saved))
      continue
    }
    if (verdict === false || (verdict == null && local?.data == null)) {
      try {
        const pulled = await pullSection(role, token, name, bag)
        remember(record, name, pulled?.updatedAt, pulled?.data)
        for (const [sibling, value] of Object.entries(pulled?.siblings || {})) {
          if (sibling !== name) remember(record, sibling, value?.updatedAt, value?.data)
        }
      } catch (error) {
        if (!error?.status || error.status >= 500 || error.status === 401) throw error
        remember(record, name, local?.updatedAt || null, local?.data ?? null)
      }
    }
  }
  await writeAccount(role, accountId, record.sections)
  onAccount?.(record)
  await clearSyncNotice()
  return record
}

async function runQueuedAccountSync(row) {
  if (running || !active || active.role !== row.role) return 'wait'
  running = true
  const job = active
  try {
    await syncAccount(job)
    return 'done'
  } catch {
    await showSyncFailedNotice()
    job.onError?.()
    return 'retry'
  } finally {
    running = false
  }
}

setAccountSyncRunner(runQueuedAccountSync)

export function startAccountSync(job) {
  active = job
  const accountId = accountIdFromToken(job.token)
  window.__palaJabaSyncRetry = () => {
    void enqueueAccountSync({ role: job.role, accountId }).then(() => drainOutbox())
  }
  void enqueueAccountSync({ role: job.role, accountId }).then(() => drainOutbox())
}
