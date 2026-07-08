import AdminButton from './AdminButton'
import { adminCard, adminMuted, adminSubtle } from './adminStyles'
import { formatDateTime } from '../../lib/dates'

function StatusBadge({ active }) {
  if (active) {
    return (
      <span className="rounded-md border border-brand-green/35 bg-brand-green/15 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-200">
        Activo
      </span>
    )
  }

  return (
    <span className="rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-zinc-400">
      Inactivo
    </span>
  )
}

export default function AdminDiscountCodeCard({ item, busy, onEdit, onDelete }) {
  return (
    <li className={`${adminCard} ${item.is_active ? 'border-brand-green/20' : 'opacity-90'}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border ${
              item.is_active
                ? 'border-brand-green/30 bg-brand-green/10 text-emerald-200'
                : 'border-zinc-700 bg-zinc-900/80 text-zinc-400'
            }`}
            aria-hidden="true"
          >
            <span className="text-2xl font-bold tabular-nums leading-none">{item.percent_off}</span>
            <span className="mt-0.5 text-[0.6rem] font-semibold uppercase tracking-wider">% off</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate font-mono text-lg font-bold tracking-wide text-white sm:text-xl">
                {item.code}
              </h2>
              <StatusBadge active={item.is_active} />
            </div>
            <p className={`mt-1.5 text-sm ${adminSubtle}`}>
              Los vendedores lo aplican al registrarse en Pa&apos; La Jaba.
            </p>
            <p className={`mt-1 text-xs ${adminMuted}`}>
              Actualizado {formatDateTime(item.updated_at)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:shrink-0 sm:items-stretch sm:self-center">
          <AdminButton
            type="button"
            variant="secondary"
            className="!w-full sm:!min-w-[7.5rem]"
            onClick={() => onEdit(item)}
            disabled={busy}
          >
            Editar
          </AdminButton>
          <AdminButton
            type="button"
            variant="danger"
            className="!w-full sm:!min-w-[7.5rem]"
            onClick={() => onDelete(item)}
            disabled={busy}
          >
            Eliminar
          </AdminButton>
        </div>
      </div>
    </li>
  )
}
