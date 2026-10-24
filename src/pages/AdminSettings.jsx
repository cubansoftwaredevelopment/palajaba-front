import { useCallback, useEffect, useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminButton from '../components/admin/AdminButton'
import AdminSelect from '../components/admin/AdminSelect'
import {
  adminAlertError,
  adminAlertSuccess,
  adminCard,
  adminInput,
  adminLabel,
  adminMuted,
  adminSection,
  adminSubtle,
} from '../components/admin/adminStyles'
import { fetchAdminSettings, updateAdminSettings } from '../lib/api'
import { getUserFacingMessage, isSessionError } from '../lib/userFacingError'
import { clearAdminToken, getAdminToken } from '../lib/adminAuth'
import { PHONE_PREFIX, formatPhoneDigits, getPhoneDigits } from '../lib/phone'
import LoadingState from '../components/ui/LoadingState'
import { BILLING_LABELS, PLAN_TIER_LABELS } from '../constants/admin'
import { DISPLAY_CURRENCIES } from '../constants/currencies'
import {
  BILLING_PERIOD_ORDER,
  DEFAULT_PLAN_PRICES,
  PLAN_DISPLAY_CURRENCY,
  PLAN_TIER_ORDER,
  formatPlanAmount,
  normalizePlanPrices,
} from '../constants/plan'
import {
  ADVERTISING_PLAN_IDS,
  ADVERTISING_PLAN_LABELS,
  DEFAULT_ADVERTISING_PRICES,
} from '../constants/advertisingPlans'
import { convertBetweenCurrencies } from '../lib/displayPrice'
import { areExchangeRatesAvailable, getCupPerUnit, loadExchangeRates } from '../lib/exchangeRates'

const fieldShell =
  'flex min-h-12 overflow-hidden rounded-xl border border-zinc-800/90 bg-zinc-900/70 transition-colors focus-within:border-brand-green/35 focus-within:ring-2 focus-within:ring-brand-green/15'

function newAdminRow(email = '', phone = '') {
  return {
    key: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    email,
    phone,
  }
}

function adminsFromSettings(data) {
  if (Array.isArray(data?.admins) && data.admins.length) {
    return data.admins.map((admin) => newAdminRow(admin.email ?? '', admin.phone ?? ''))
  }
  if (data?.admin_email || data?.admin_phone) {
    return [newAdminRow(data.admin_email ?? '', data.admin_phone ?? '')]
  }
  return [newAdminRow()]
}

const amountInputClass =
  'min-w-0 flex-1 border-0 bg-transparent px-4 py-3 text-base tabular-nums text-zinc-100 placeholder:text-zinc-600 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

function pricesToForm(planPrices) {
  const normalized = normalizePlanPrices(planPrices)
  return PLAN_TIER_ORDER.reduce((tiers, tier) => {
    tiers[tier] = BILLING_PERIOD_ORDER.reduce((periods, period) => {
      periods[period] = {
        amount: String(normalized[tier][period].amount),
        currency: normalized[tier][period].currency,
      }
      return periods
    }, {})
    return tiers
  }, {})
}

function parseAmount(value) {
  const amount = Number(String(value).trim().replace(',', '.'))
  if (!Number.isFinite(amount) || amount < 0) return null
  return amount
}

function cupPreview(amount, currency, cupPerUnit) {
  if (currency === PLAN_DISPLAY_CURRENCY) {
    return formatPlanAmount(Math.round(amount), PLAN_DISPLAY_CURRENCY)
  }
  if (!areExchangeRatesAvailable()) return null
  const converted = convertBetweenCurrencies(amount, currency, PLAN_DISPLAY_CURRENCY, cupPerUnit)
  if (converted == null) return null
  return formatPlanAmount(converted, PLAN_DISPLAY_CURRENCY)
}

function PlanPriceField({ label, value, onChange, cupPerUnit }) {
  const amountId = useId()
  const currencyId = useId()
  const amount = parseAmount(value.amount)
  const preview = amount == null ? null : cupPreview(amount, value.currency, cupPerUnit)

  return (
    <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/25 p-3.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={amountId} className="text-sm font-medium text-zinc-200">
          {label}
        </label>
        {preview ? (
          <span className="rounded-full border border-brand-green/20 bg-brand-green/10 px-2 py-0.5 text-[0.65rem] font-semibold tabular-nums text-brand-green">
            ≈ {preview}
          </span>
        ) : (
          <span className={`text-[0.65rem] ${adminMuted}`}>En CUP al publicar</span>
        )}
      </div>
      <div className={`${fieldShell} mt-2.5`}>
        <input
          id={amountId}
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={value.amount}
          onChange={(event) => onChange({ ...value, amount: event.target.value })}
          className={amountInputClass}
          placeholder="0"
          required
        />
        <label htmlFor={currencyId} className="sr-only">
          Moneda de {label}
        </label>
        <AdminSelect
          id={currencyId}
          variant="plain"
          className="w-[6.25rem] shrink-0"
          ariaLabel={`Moneda de ${label}`}
          value={value.currency}
          onChange={(currency) => onChange({ ...value, currency })}
          options={DISPLAY_CURRENCIES.map((currency) => ({ value: currency.code, label: currency.code }))}
        />
      </div>
    </div>
  )
}

export default function AdminSettings() {
  const navigate = useNavigate()
  const [phoneDigits, setPhoneDigits] = useState('')
  const [admins, setAdmins] = useState(() => [newAdminRow()])
  const [advertisingPrices, setAdvertisingPrices] = useState(() => ({
    'ads-10': String(DEFAULT_ADVERTISING_PRICES['ads-10']),
    'ads-20': String(DEFAULT_ADVERTISING_PRICES['ads-20']),
    'ads-30': String(DEFAULT_ADVERTISING_PRICES['ads-30']),
  }))
  const [planPrices, setPlanPrices] = useState(() => pricesToForm(DEFAULT_PLAN_PRICES))
  const [cupPerUnit, setCupPerUnit] = useState(() => getCupPerUnit())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadSettings = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const token = getAdminToken()
      const [data] = await Promise.all([
        fetchAdminSettings(token),
        loadExchangeRates().catch(() => null),
      ])
      setPhoneDigits(data.renewal_contact_phone ?? '')
      setAdmins(adminsFromSettings(data))
      setAdvertisingPrices({
        'ads-10': String(
          data.advertising_prices?.['ads-10']?.amount
            ?? data.advertising_prices?.ads_10?.amount
            ?? DEFAULT_ADVERTISING_PRICES['ads-10'],
        ),
        'ads-20': String(
          data.advertising_prices?.['ads-20']?.amount
            ?? data.advertising_prices?.ads_20?.amount
            ?? DEFAULT_ADVERTISING_PRICES['ads-20'],
        ),
        'ads-30': String(
          data.advertising_prices?.['ads-30']?.amount
            ?? data.advertising_prices?.ads_30?.amount
            ?? DEFAULT_ADVERTISING_PRICES['ads-30'],
        ),
      })
      setPlanPrices(pricesToForm(data.plan_prices ?? DEFAULT_PLAN_PRICES))
      setCupPerUnit(getCupPerUnit())
    } catch (err) {
      if (isSessionError(err)) {
        clearAdminToken()
        navigate('/admin', { replace: true })
        return
      }
      setError(getUserFacingMessage(err, 'No pudimos cargar la configuración.'))
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  function updatePrice(tier, period, next) {
    setPlanPrices((current) => ({
      ...current,
      [tier]: {
        ...current[tier],
        [period]: next,
      },
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (phoneDigits.length !== 8) {
      setError('Indica un teléfono cubano de 8 dígitos.')
      return
    }

    const parsedAdmins = []
    for (const admin of admins) {
      const email = admin.email.trim()
      const phone = admin.phone.trim()
      if (!email && !phone) {
        setError('Completa el correo y el teléfono de cada administrador.')
        return
      }
      if (!email || !phone) {
        setError('Cada administrador necesita correo y teléfono.')
        return
      }
      parsedAdmins.push({ email, phone })
    }
    if (!parsedAdmins.length) {
      setError('Agrega al menos un administrador.')
      return
    }

    const parsedAds = {}
    for (const planId of ADVERTISING_PLAN_IDS) {
      const amount = parseAmount(advertisingPrices[planId])
      if (amount == null) {
        setError('Cada precio de publicidad debe ser un número mayor o igual a 0.')
        return
      }
      parsedAds[planId] = { amount }
    }

    const parsedPrices = {}
    for (const tier of PLAN_TIER_ORDER) {
      parsedPrices[tier] = {}
      for (const period of BILLING_PERIOD_ORDER) {
        const amount = parseAmount(planPrices[tier][period].amount)
        if (amount == null) {
          setError('Cada precio debe ser un número mayor o igual a 0.')
          return
        }
        parsedPrices[tier][period] = {
          amount,
          currency: planPrices[tier][period].currency,
        }
      }
    }

    setSaving(true)
    try {
      const token = getAdminToken()
      const updated = await updateAdminSettings(token, {
        renewal_contact_phone: phoneDigits,
        plan_prices: parsedPrices,
        advertising_prices: parsedAds,
        admins: parsedAdmins,
      })
      setPhoneDigits(updated.renewal_contact_phone ?? phoneDigits)
      setAdmins(adminsFromSettings(updated))
      setAdvertisingPrices({
        'ads-10': String(updated.advertising_prices?.['ads-10']?.amount ?? parsedAds['ads-10'].amount),
        'ads-20': String(updated.advertising_prices?.['ads-20']?.amount ?? parsedAds['ads-20'].amount),
        'ads-30': String(updated.advertising_prices?.['ads-30']?.amount ?? parsedAds['ads-30'].amount),
      })
      setPlanPrices(pricesToForm(updated.plan_prices ?? parsedPrices))
      setSuccess('Configuración guardada.')
    } catch (err) {
      setError(getUserFacingMessage(err, 'No pudimos guardar la configuración.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={adminSection}>
      {success && (
        <p className={`mb-4 ${adminAlertSuccess}`} role="status">
          {success}
        </p>
      )}

      {error && (
        <p className={`mb-4 ${adminAlertError}`} role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <LoadingState variant="admin" message="Cargando configuración…" />
      ) : (
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-6xl flex-col gap-4 pb-20">
          <div className="grid gap-4 md:grid-cols-2 md:items-start">
            <section className={adminCard}>
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-zinc-100">Precios de marketing</h2>
                <p className={`mt-1.5 text-sm leading-relaxed ${adminSubtle}`}>
                  Montos en USD. Al cobrar se suma 0.5% de exchange de QvaPay.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {ADVERTISING_PLAN_IDS.map((planId) => (
                  <div key={planId} className="rounded-xl border border-zinc-800/70 bg-zinc-950/25 p-3.5">
                    <label htmlFor={`ads-${planId}`} className="text-sm font-medium text-zinc-200">
                      {ADVERTISING_PLAN_LABELS[planId]}
                    </label>
                    <div className={`${fieldShell} mt-2.5`}>
                      <input
                        id={`ads-${planId}`}
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={advertisingPrices[planId]}
                        onChange={(event) =>
                          setAdvertisingPrices((current) => ({
                            ...current,
                            [planId]: event.target.value,
                          }))
                        }
                        className={amountInputClass}
                        placeholder="0"
                        required
                      />
                      <span className="flex shrink-0 items-center px-3 text-sm font-semibold text-zinc-400">
                        USD
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-zinc-800/70 bg-zinc-950/25 p-3.5">
                <h3 className="text-sm font-semibold text-zinc-100">Renovaciones</h3>
                <p className={`mt-1.5 mb-3 text-sm leading-relaxed ${adminSubtle}`}>
                  Este número recibe los mensajes de WhatsApp cuando un vendedor quiere renovar su plan.
                </p>
                <label htmlFor="renewal-contact-phone" className={adminLabel}>
                  Teléfono
                  <span className="text-orange-300" aria-hidden="true">
                    {' '}
                    *
                  </span>
                </label>
                <div className={fieldShell}>
                  <span className="flex shrink-0 items-center border-r border-zinc-800/90 bg-zinc-950/40 px-3 text-sm font-semibold text-zinc-300">
                    {PHONE_PREFIX}
                  </span>
                  <input
                    id="renewal-contact-phone"
                    type="tel"
                    inputMode="numeric"
                    value={formatPhoneDigits(phoneDigits)}
                    onChange={(event) => setPhoneDigits(getPhoneDigits(event.target.value))}
                    className={`${adminInput} min-h-12 rounded-none border-0 bg-transparent focus:ring-0`}
                    placeholder="5 123 4567"
                    autoComplete="tel-national"
                    required
                  />
                </div>
                <p className={`mt-2 text-xs ${adminMuted}`}>
                  Obligatorio para que «Renovar plan» abra WhatsApp con un mensaje listo.
                </p>
              </div>
            </section>

            <section className={adminCard}>
              <h2 className="text-sm font-semibold text-zinc-100">Administradores</h2>
              <p className={`mt-1.5 mb-4 text-sm leading-relaxed ${adminSubtle}`}>
                Reciben el aviso por SMS cuando un vendedor paga un plan de publicidad (solo números
                +53).
              </p>
              <div className="flex flex-col gap-3">
                {admins.map((admin, index) => (
                  <article
                    key={admin.key}
                    className="rounded-xl border border-zinc-800/70 bg-zinc-950/25 p-3.5"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-zinc-200">
                        Administrador {index + 1}
                      </p>
                      {admins.length > 1 ? (
                        <AdminButton
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() =>
                            setAdmins((current) => current.filter((item) => item.key !== admin.key))
                          }
                        >
                          Quitar
                        </AdminButton>
                      ) : null}
                    </div>
                    <div className="grid gap-4">
                      <div>
                        <label htmlFor={`admin-email-${admin.key}`} className={adminLabel}>
                          Correo
                          <span className="text-orange-300" aria-hidden="true">
                            {' '}
                            *
                          </span>
                        </label>
                        <input
                          id={`admin-email-${admin.key}`}
                          type="email"
                          value={admin.email}
                          onChange={(event) =>
                            setAdmins((current) =>
                              current.map((item) =>
                                item.key === admin.key
                                  ? { ...item, email: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          className={`${adminInput} min-h-12`}
                          placeholder="admin@palajaba.com"
                          autoComplete="email"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor={`admin-phone-${admin.key}`} className={adminLabel}>
                          Teléfono
                          <span className="text-orange-300" aria-hidden="true">
                            {' '}
                            *
                          </span>
                        </label>
                        <input
                          id={`admin-phone-${admin.key}`}
                          type="tel"
                          value={admin.phone}
                          onChange={(event) =>
                            setAdmins((current) =>
                              current.map((item) =>
                                item.key === admin.key
                                  ? { ...item, phone: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          className={`${adminInput} min-h-12`}
                          placeholder="+53 5 123 4567"
                          autoComplete="tel"
                          required
                        />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <AdminButton
                type="button"
                variant="secondary"
                size="sm"
                className="mt-3 w-full sm:w-auto"
                onClick={() => setAdmins((current) => [...current, newAdminRow()])}
              >
                Añadir administrador
              </AdminButton>
            </section>
          </div>

          <section className={adminCard}>
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-zinc-100">Precios de los planes</h2>
              <p className={`mt-1.5 text-sm leading-relaxed ${adminSubtle}`}>
                Escribe el monto y elige la moneda. El vendedor siempre lo ve convertido a CUP.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {PLAN_TIER_ORDER.map((tier) => (
                <article
                  key={tier}
                  className="rounded-2xl border border-zinc-800/80 bg-zinc-900/35 p-4"
                >
                  <h3 className="text-base font-semibold text-zinc-50">
                    Plan {PLAN_TIER_LABELS[tier]}
                  </h3>
                  <div className="mt-3 flex flex-col gap-3">
                    {BILLING_PERIOD_ORDER.map((period) => (
                      <PlanPriceField
                        key={period}
                        label={BILLING_LABELS[period]}
                        value={planPrices[tier][period]}
                        onChange={(next) => updatePrice(tier, period, next)}
                        cupPerUnit={cupPerUnit}
                      />
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="pointer-events-none fixed right-4 bottom-[max(1.25rem,var(--safe-bottom))] z-30 sm:right-6 lg:right-8">
            <AdminButton
              type="submit"
              className="pointer-events-auto !w-auto min-w-[12.5rem] shadow-[0_8px_28px_rgba(0,0,0,0.28)]"
              disabled={saving || phoneDigits.length !== 8}
            >
              {saving ? 'Guardando…' : 'Guardar configuración'}
            </AdminButton>
          </div>
        </form>
      )}
    </div>
  )
}
