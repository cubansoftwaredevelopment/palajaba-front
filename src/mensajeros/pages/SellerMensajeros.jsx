import { useCallback, useEffect, useState } from 'react'
import ConfirmModal from '../../shared/componentes/ConfirmModal.jsx'
import SearchBar from '../../buyer/componentes/SearchBar.jsx'
import FilterModal from '../../shared/componentes/FilterModal.jsx'
import SellerModalPortal from '../../seller/componentes/SellerModalPortal.jsx'
import SellerPageHeader from '../../seller/componentes/SellerPageHeader.jsx'
import {
  sellerBtnPrimary,
  sellerBtnSecondary,
  sellerLabel,
  sellerModalBody,
  sellerModalFooter,
  sellerModalInput,
  sellerModalTitle,
  sellerPageWrap,
  sellerSection,
} from '../../seller/componentes/sellerStyles.js'
import { useFormErrorToast } from '../../shared/componentes/useFormErrorToast.jsx'
import { getUserFacingMessage } from '../../shared/utils/userFacingError.js'
import { getSellerToken } from '../../seller/utils/sellerAuth.js'
import SellerMotionSheet, { useSellerSheet } from '../../motion/SellerMotionSheet'
import { createSellerMensajero, deleteSellerMensajero, fetchSellerMensajeros, updateSellerMensajero } from '../api'
import { runSectionRefresh } from '../../session/sectionStore'
import { useRegisterSectionRefresh } from '../../session/useSectionRefresh'
import { useSectionSnapshot } from '../../session/useSectionSnapshot'
import { VEHICLE_TYPES, vehicleLabel } from '../utils/constants.js'

const SEARCH_HINTS = ['buscar por nombre', 'buscar por apellido']

function CreateMensajeroModal({ messenger = null, onClose: requestClose, onCreated }) {
  const editing = Boolean(messenger)
  const { dismiss: onClose, closing, sheetProps } = useSellerSheet(requestClose)
  const [form, setForm] = useState({
    name: messenger ? `${messenger.first_name} ${messenger.last_name}`.trim() : '',
    phone: messenger?.phone || '',
    username: messenger?.username || '',
  })
  const [saving, setSaving] = useState(false)
  const { showError, toastNode } = useFormErrorToast({ aboveNav: true, layerClassName: '!z-[260]' })

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
    showError('')
  }

  async function create(event) {
    event.preventDefault()
    const parts = form.name.trim().split(/\s+/).filter(Boolean)
    const firstName = parts[0] || ''
    const lastName = parts.slice(1).join(' ')
    if (!firstName || !lastName) {
      showError('Escribe el nombre y el apellido.')
      return
    }
    setSaving(true)
    showError('')
    try {
      await (editing
        ? updateSellerMensajero(getSellerToken(), messenger.id, {
          first_name: firstName,
          last_name: lastName,
          phone: form.phone,
          username: form.username,
        })
        : createSellerMensajero(getSellerToken(), {
          first_name: firstName,
          last_name: lastName,
          phone: form.phone,
          username: form.username,
        }))
      onCreated()
    } catch (err) {
      showError(getUserFacingMessage(err, editing ? 'No se pudo guardar el mensajero.' : 'No se pudo crear el mensajero.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <SellerModalPortal>
      <SellerMotionSheet
        onClose={onClose}
        closing={closing}
        sheetProps={sheetProps}
        labelledBy="create-mensajero-title"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-brand-green/10 px-5 py-4">
          <h2 id="create-mensajero-title" className={sellerModalTitle}>{editing ? 'Editar mensajero' : 'Nuevo mensajero'}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-2xl leading-none text-brand-carmelita/65 hover:bg-brand-green/8"
          >
            ×
          </button>
        </header>
        <form onSubmit={create} className="flex min-h-0 flex-1 flex-col">
          <div className={`${sellerModalBody} space-y-3`}>
            <div>
              <label htmlFor="mensajero-name" className={sellerLabel}>Nombre y apellido</label>
              <input id="mensajero-name" className={`mt-1.5 ${sellerModalInput}`} required value={form.name} onChange={(event) => update('name', event.target.value)} autoComplete="name" />
            </div>
            <div>
              <label htmlFor="mensajero-phone" className={sellerLabel}>Teléfono</label>
              <input id="mensajero-phone" className={`mt-1.5 ${sellerModalInput}`} required inputMode="tel" value={form.phone} onChange={(event) => update('phone', event.target.value)} autoComplete="tel" />
            </div>
            <div>
              <label htmlFor="mensajero-alias" className={sellerLabel}>Alias</label>
              <input id="mensajero-alias" className={`mt-1.5 ${sellerModalInput}`} required value={form.username} onChange={(event) => update('username', event.target.value)} autoComplete="off" />
            </div>
          </div>
          <div className={`${sellerModalFooter} grid grid-cols-2 gap-2`}>
            <button type="button" onClick={onClose} disabled={saving} className={sellerBtnSecondary}>Cancelar</button>
            <button type="submit" disabled={saving} className={sellerBtnPrimary}>{saving ? 'Guardando…' : editing ? 'Guardar' : 'Crear mensajero'}</button>
          </div>
        </form>
      </SellerMotionSheet>
      {toastNode}
    </SellerModalPortal>
  )
}

export default function SellerMensajeros() {
  const { snapshot, commit, skipInitialRef } = useSectionSnapshot('seller', 'mensajeros')
  const [items, setItems] = useState(snapshot?.data ?? [])
  const [search, setSearch] = useState(snapshot?.query?.search ?? '')
  const [vehicleType, setVehicleType] = useState(snapshot?.query?.vehicleType ?? '')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const data = await fetchSellerMensajeros(getSellerToken(), { search, vehicleType })
    const next = data.items || []
    setItems(next)
    commit(next, { search, vehicleType })
  }, [search, vehicleType, commit])

  useEffect(() => {
    if (skipInitialRef.current) return undefined
    const timer = window.setTimeout(() => { load().catch((err) => setError(err.message)) }, 200)
    return () => window.clearTimeout(timer)
  }, [load])

  useRegisterSectionRefresh(() => runSectionRefresh('seller', 'mensajeros', () => load().catch((err) => setError(err.message))))

  async function confirmDelete() {
    if (!toDelete || deleting) return
    setDeleting(true)
    setError('')
    try {
      await deleteSellerMensajero(getSellerToken(), toDelete.id)
      setToDelete(null)
      await load()
    } catch (err) {
      setError(getUserFacingMessage(err, 'No se pudo eliminar el mensajero.'))
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={sellerPageWrap}>
      <SellerPageHeader eyebrow="Mensajeros" subtitle="Crea el alias con el que entra cada mensajero." />
      <div className="mb-4">
        <SearchBar
          id="seller-mensajeros-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onClear={() => setSearch('')}
          label="Buscar mensajeros"
          phrases={SEARCH_HINTS}
          filter={{
            count: vehicleType ? 1 : 0,
            label: 'Filtrar por vehículo',
            expanded: filtersOpen,
            onClick: () => setFiltersOpen(true),
          }}
        />
      </div>
      <button type="button" className={`${sellerBtnPrimary} mb-4 max-w-xs`} onClick={() => setOpen(true)}>Agregar mensajero</button>
      {error ? <p className="mb-3 text-sm font-semibold text-red-700">{error}</p> : null}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className={`${sellerSection} px-3 py-3`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-brand-carmelita">{item.first_name} {item.last_name}</p>
                <p className="mt-1 text-sm text-brand-carmelita">{item.phone} · {item.username}</p>
                <p className="text-xs text-brand-green">{(item.vehicle_types || []).map(vehicleLabel).join(', ') || 'Sin vehículo'}</p>
                <button type="button" className="mt-1 text-sm font-semibold text-brand-green" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/mensajero/${item.username}`)}>Copiar enlace</button>
              </div>
              <div className="flex shrink-0 gap-1">
                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-green touch-manipulation active:bg-brand-green/10" aria-label={`Editar a ${item.first_name}`} onClick={() => setEditing(item)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                </button>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-carmelita/70 touch-manipulation active:bg-brand-carmelita/10 disabled:opacity-40"
                  aria-label={item.open_assignments ? `${item.first_name} tiene pedidos asignados` : `Eliminar a ${item.first_name}`}
                  title={item.open_assignments ? 'Tiene pedidos asignados' : 'Eliminar'}
                  disabled={Boolean(item.open_assignments)}
                  onClick={() => setToDelete(item)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {open ? (
        <CreateMensajeroModal
          onClose={() => setOpen(false)}
          onCreated={() => {
            setOpen(false)
            load().catch((err) => setError(err.message))
          }}
        />
      ) : null}
      {editing ? (
        <CreateMensajeroModal
          messenger={editing}
          onClose={() => setEditing(null)}
          onCreated={() => {
            setEditing(null)
            load().catch((err) => setError(err.message))
          }}
        />
      ) : null}
      {toDelete ? (
        <ConfirmModal
          title={`¿Eliminar a ${toDelete.first_name} ${toDelete.last_name}?`}
          description="Su enlace deja de servir. Los pedidos ya cerrados se conservan."
          confirmLabel={deleting ? 'Eliminando…' : 'Sí, eliminar'}
          confirmVariant="tertiary"
          onClose={() => { if (!deleting) setToDelete(null) }}
          onConfirm={confirmDelete}
        />
      ) : null}
      <FilterModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filtrar mensajeros"
        description="Entra quien tenga al menos un vehículo de ese tipo."
        titleId="mensajeros-filter-title"
        applyLabel="Aplicar"
        columns={1}
        fields={[{
          key: 'vehicle',
          label: 'Tipo de vehículo',
          placeholder: 'Todos los vehículos',
          options: VEHICLE_TYPES.map((item) => ({ value: item.id, label: item.label })),
        }]}
        values={{ vehicle: vehicleType }}
        emptyValues={{ vehicle: '' }}
        onApply={(next) => setVehicleType(next.vehicle || '')}
      />
    </div>
  )
}
