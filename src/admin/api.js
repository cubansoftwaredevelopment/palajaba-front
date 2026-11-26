import { downloadBlob } from '../shared/utils/downloadFile.js'
import { ApiError, getApiBase, parseApiErrorDetail, request } from '../api/client.js'

export function fetchAdminNotifications(token) {
  return request("/api/admin/notifications", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function sendAdminNotification(token, payload) {
  return request("/api/admin/notifications", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export function sendAdminNotificationSms(token, batchId) {
  return request(`/api/admin/notifications/${encodeURIComponent(batchId)}/sms`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function fetchAdminDisputes(token) {
  return request('/api/admin/disputes', { headers: { Authorization: `Bearer ${token}` } })
}

export function fetchAdminDispute(token, disputeId) {
  return request(`/api/admin/disputes/${encodeURIComponent(disputeId)}`, { headers: { Authorization: `Bearer ${token}` } })
}

export function fetchAdminDisputesOpenCount(token) {
  return request('/api/admin/disputes/open-count', { headers: { Authorization: `Bearer ${token}` } })
}

export async function downloadAdminDisputeReport(token, disputeId, kind) {
  const response = await fetch(
    `${getApiBase()}/api/admin/disputes/${encodeURIComponent(disputeId)}/agreements/${encodeURIComponent(kind)}.pdf`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const parsed = parseApiErrorDetail(data.detail)
    throw new ApiError(parsed.message, { code: parsed.code, data: parsed.data, status: response.status })
  }
  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename="([^"]+)"/)
  await downloadBlob(blob, match?.[1] || `${kind}-${String(disputeId).slice(-6)}.pdf`, 'application/pdf')
}

export function ruleAdminDispute(token, disputeId, payload) {
  return request(`/api/admin/disputes/${encodeURIComponent(disputeId)}/ruling`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
}

export function fetchPendingPluginAddons(token) {
  return request('/api/admin/plugin-addons/pending', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function approvePluginAddon(token, purchaseId) {
  return request(`/api/admin/plugin-addons/${encodeURIComponent(purchaseId)}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function rejectPluginAddon(token, purchaseId) {
  return request(`/api/admin/plugin-addons/${encodeURIComponent(purchaseId)}/reject`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function fetchAdminSettings(token) {
  return request("/api/admin/settings", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function sendAdminSmtpTest(token, email) {
  return request("/api/admin/settings/smtp-test", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email }),
  });
}

export function updateAdminSettings(token, payload) {
  return request("/api/admin/settings", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

function financeAuth(token) {
  return { Authorization: `Bearer ${token}` };
}

function financeWindowParams({ start, end, currency, includeLiquidated, includeDeleted } = {}) {
  const params = new URLSearchParams();
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  if (currency) params.set("currency", currency);
  if (includeLiquidated) params.set("include_liquidated", "true");
  if (includeDeleted) params.set("include_deleted", "true");
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function fetchFinanceExpenses(token) {
  return request("/api/admin/finance/expenses", { headers: financeAuth(token) });
}

export function createFinanceExpense(token, payload) {
  return request("/api/admin/finance/expenses", {
    method: "POST",
    headers: financeAuth(token),
    body: JSON.stringify(payload),
  });
}

export function updateFinanceExpense(token, id, payload) {
  return request(`/api/admin/finance/expenses/${id}`, {
    method: "PATCH",
    headers: financeAuth(token),
    body: JSON.stringify(payload),
  });
}

export function deleteFinanceExpense(token, id) {
  return request(`/api/admin/finance/expenses/${id}`, {
    method: "DELETE",
    headers: financeAuth(token),
  });
}

export function fetchFinanceDebts(token, options = {}) {
  return request(`/api/admin/finance/debts${financeWindowParams(options)}`, {
    headers: financeAuth(token),
  });
}

export function updateFinanceDebt(token, id, payload) {
  return request(`/api/admin/finance/debts/${id}`, {
    method: "PATCH",
    headers: financeAuth(token),
    body: JSON.stringify(payload),
  });
}

export function generateFinanceDebts(token, payload = {}) {
  return request("/api/admin/finance/debts/generate", {
    method: "POST",
    headers: financeAuth(token),
    body: JSON.stringify(payload),
  });
}

export function liquidateFinanceDebts(token, payload) {
  return request("/api/admin/finance/debts/liquidate", {
    method: "POST",
    headers: financeAuth(token),
    body: JSON.stringify(payload),
  });
}

export function deleteFinanceDebts(token, payload) {
  return request("/api/admin/finance/debts/delete", {
    method: "POST",
    headers: financeAuth(token),
    body: JSON.stringify(payload),
  });
}

export function fetchFinanceLedger(token, options = {}) {
  return request(`/api/admin/finance/ledger${financeWindowParams(options)}`, {
    headers: financeAuth(token),
  });
}

export function createFinanceExtraction(token, payload) {
  return request("/api/admin/finance/ledger/extractions", {
    method: "POST",
    headers: financeAuth(token),
    body: JSON.stringify(payload),
  });
}

export function fetchAdminDiscountCodes(token) {
  return request("/api/admin/discount-codes", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function createAdminDiscountCode(token, payload) {
  return request("/api/admin/discount-codes", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export function updateAdminDiscountCode(token, id, payload) {
  return request(`/api/admin/discount-codes/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export function deleteAdminDiscountCode(token, id) {
  return request(`/api/admin/discount-codes/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function fetchAdminBanners(token) {
  return request("/api/admin/banners", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createAdminBanner(
  token,
  file,
  { title = "", linkUrl = "", provinceIds = [], deactivateAt = "" } = {},
) {
  const formData = new FormData();
  formData.append("file", file);
  if (title) formData.append("title", title);
  if (linkUrl) formData.append("link_url", linkUrl);
  if (deactivateAt) formData.append("deactivate_at", deactivateAt);
  for (const provinceId of provinceIds || []) {
    formData.append("province_ids", provinceId);
  }

  const response = await fetch(`${getApiBase()}/api/admin/banners`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const parsed = parseApiErrorDetail(data.detail);
    throw new ApiError(parsed.message, {
      code: parsed.code,
      data: parsed.data,
    });
  }

  return response.json();
}

export function updateAdminBanner(token, bannerId, payload) {
  const body = { ...payload };
  if (typeof body.linkUrl !== "undefined") {
    body.link_url = body.linkUrl;
    delete body.linkUrl;
  }
  return request(`/api/admin/banners/${encodeURIComponent(bannerId)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

export async function replaceAdminBannerImage(token, bannerId, file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(
    `${getApiBase()}/api/admin/banners/${encodeURIComponent(bannerId)}/image`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const parsed = parseApiErrorDetail(data.detail);
    throw new ApiError(parsed.message, {
      code: parsed.code,
      data: parsed.data,
    });
  }

  return response.json();
}

export function deleteAdminBanner(token, bannerId) {
  return request(`/api/admin/banners/${encodeURIComponent(bannerId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
  }
}

function appendChartWindow(params, { year, month, start, end } = {}) {
  if (start && end) {
    params.set('start', start)
    params.set('end', end)
    return
  }
  if (year != null) params.set('year', String(year))
  if (month != null) params.set('month', String(month))
}

export function fetchAdminStats(token, { year, month } = {}) {
  const params = new URLSearchParams()
  if (year != null) params.set('year', String(year))
  if (month != null) params.set('month', String(month))
  const query = params.toString() ? `?${params.toString()}` : ''

  return request(`/api/admin/stats/summary${query}`, {
    headers: authHeaders(token),
  })
}

export function fetchAdminBusinessesByProvince(token) {
  return request('/api/admin/stats/businesses-by-province', {
    headers: authHeaders(token),
  })
}

export function fetchAdminRevenueChart(token, { granularity, year, month, start, end } = {}) {
  const params = new URLSearchParams({ granularity })
  appendChartWindow(params, { year, month, start, end })

  return request(`/api/admin/stats/revenue?${params.toString()}`, {
    headers: authHeaders(token),
  })
}

export function fetchAdminTrafficChart(token, { granularity, year, month, start, end } = {}) {
  const params = new URLSearchParams({ granularity })
  appendChartWindow(params, { year, month, start, end })

  return request(`/api/admin/stats/traffic?${params.toString()}`, {
    headers: authHeaders(token),
  })
}

export function fetchAdminTrafficLocations(token, { year, month, start, end } = {}) {
  const params = new URLSearchParams()
  appendChartWindow(params, { year, month, start, end })
  const query = params.toString() ? `?${params.toString()}` : ''

  return request(`/api/admin/stats/traffic/locations${query}`, {
    headers: authHeaders(token),
  })
}

export function fetchAdminTrafficPatterns(token, { year, month, start, end } = {}) {
  const params = new URLSearchParams()
  appendChartWindow(params, { year, month, start, end })
  const query = params.toString() ? `?${params.toString()}` : ''

  return request(`/api/admin/stats/traffic/patterns${query}`, {
    headers: authHeaders(token),
  })
}

export function fetchAdminOrdersChart(token, { granularity, year, month, start, end } = {}) {
  const params = new URLSearchParams({ granularity })
  appendChartWindow(params, { year, month, start, end })

  return request(`/api/admin/stats/orders?${params.toString()}`, {
    headers: authHeaders(token),
  })
}

export function fetchAdminOrderSalesChart(token, { granularity, year, month, start, end } = {}) {
  const params = new URLSearchParams({ granularity })
  appendChartWindow(params, { year, month, start, end })

  return request(`/api/admin/stats/orders/sales?${params.toString()}`, {
    headers: authHeaders(token),
  })
}

export function fetchAdminDeviceStats(token, { granularity, year, month, start, end } = {}) {
  const params = new URLSearchParams({ granularity })
  appendChartWindow(params, { year, month, start, end })

  return request(`/api/admin/stats/devices?${params.toString()}`, {
    headers: authHeaders(token),
  })
}

export function fetchAdminOrdersTopBusinesses(token, { granularity, start, end } = {}) {
  const params = new URLSearchParams({ granularity })
  appendChartWindow(params, { start, end })
  return request(`/api/admin/stats/orders/top-businesses?${params.toString()}`, {
    headers: authHeaders(token),
  })
}

export function fetchAdminTopSoldProducts(token, { granularity, start, end } = {}) {
  const params = new URLSearchParams({ granularity })
  appendChartWindow(params, { start, end })
  return request(`/api/admin/stats/products/sold?${params.toString()}`, {
    headers: authHeaders(token),
  })
}

export function fetchAdminTopPopularProducts(token, { granularity, start, end } = {}) {
  const params = new URLSearchParams({ granularity })
  appendChartWindow(params, { start, end })
  return request(`/api/admin/stats/products/popular?${params.toString()}`, {
    headers: authHeaders(token),
  })
}

export function fetchAdminOrdersLocations(token, { granularity, start, end } = {}) {
  const params = new URLSearchParams({ granularity })
  appendChartWindow(params, { start, end })
  return request(`/api/admin/stats/orders/locations?${params.toString()}`, {
    headers: authHeaders(token),
  })
}

export function fetchAdminDeliveryMap(token, { granularity, start, end } = {}) {
  const params = new URLSearchParams({ granularity })
  appendChartWindow(params, { start, end })
  return request(`/api/admin/stats/orders/delivery-map?${params.toString()}`, {
    headers: authHeaders(token),
  })
}
