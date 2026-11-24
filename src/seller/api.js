import { downloadBlob } from '../shared/utils/downloadFile.js'
import { ApiError, getApiBase, parseApiErrorDetail, request } from '../api/client.js'

export function updateSellerStoreBanner(token, bannerId, isActive) {
  return request(`/api/auth/me/store-banners/${encodeURIComponent(bannerId)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ is_active: isActive }),
  });
}

export function deleteSellerStoreBanner(token, bannerId) {
  return request(`/api/auth/me/store-banners/${encodeURIComponent(bannerId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function uploadSellerStoreBanner(token, file) {
  const formData = new FormData();
  formData.append("photo", file);

  const response = await fetch(`${getApiBase()}/api/auth/me/store-banners`, {
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

export function fetchSellerNotifications(token, { dateFrom = '', dateTo = '', offset = 0, limit = 10, paged = false } = {}) {
  const params = new URLSearchParams()
  if (dateFrom) params.set('date_from', dateFrom)
  if (dateTo) params.set('date_to', dateTo)
  if (paged) {
    params.set('offset', String(offset))
    params.set('limit', String(limit))
  }
  const suffix = params.toString() ? `?${params}` : ''
  return request(`/api/auth/me/notifications${suffix}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function fetchSellerUnreadNotificationCount(token) {
  return request("/api/auth/me/notifications/unread-count", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function markSellerNotificationRead(token, notificationId) {
  return request(`/api/auth/me/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function markSellerSystemNotificationsRead(token) {
  return request("/api/auth/me/notifications/read-system", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function fetchSellerStatsSummary(token, { year, month } = {}) {
  const params = new URLSearchParams();
  if (year != null) params.set("year", String(year));
  if (month != null) params.set("month", String(month));
  const query = params.toString() ? `?${params.toString()}` : "";

  return request(`/api/auth/me/stats/summary${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function fetchSellerRevenueChart(
  token,
  { granularity, year, month } = {},
) {
  const params = new URLSearchParams({ granularity });
  if (year != null) params.set("year", String(year));
  if (month != null) params.set("month", String(month));

  return request(`/api/auth/me/stats/revenue?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function fetchSellerProductsSoldChart(
  token,
  { granularity, year, month } = {},
) {
  const params = new URLSearchParams({ granularity });
  if (year != null) params.set("year", String(year));
  if (month != null) params.set("month", String(month));

  return request(`/api/auth/me/stats/products-sold?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function fetchSellerTopProducts(token) {
  return request("/api/auth/me/stats/top-products", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function fetchSellerOrders(token, { offset = 0, limit = 25 } = {}) {
  const params = new URLSearchParams({ offset: String(offset), limit: String(limit) })
  return request(`/api/auth/me/orders?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function createSellerManualOrder(token, payload) {
  return request("/api/auth/me/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export function updateSellerOrder(token, orderId, payload) {
  return request(`/api/auth/me/orders/${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export function deleteSellerOrder(token, orderId) {
  return request(`/api/auth/me/orders/${encodeURIComponent(orderId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function downloadSellerOrderInvoice(
  token,
  orderId,
  type = "store",
) {
  const response = await fetch(
    `${getApiBase()}/api/auth/me/orders/${encodeURIComponent(orderId)}/invoice.pdf?type=${encodeURIComponent(type)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="([^"]+)"/);
  const filename =
    match?.[1] ?? `pedido-${orderId.slice(-6).toUpperCase()}-${type}.pdf`;

  await downloadBlob(blob, filename, "application/pdf");
}

async function downloadAuthorizedPdf(token, path, fallbackName) {
  const response = await fetch(`${getApiBase()}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const parsed = parseApiErrorDetail(data.detail);
    throw new ApiError(parsed.message, {
      code: parsed.code,
      data: parsed.data,
    });
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="([^"]+)"/);
  await downloadBlob(blob, match?.[1] ?? fallbackName, "application/pdf");
}

function orderDocumentPath(base, orderId, kind) {
  const id = encodeURIComponent(orderId);
  if (kind === "evidence") return `${base}/${id}/evidence.pdf`;
  return `${base}/${id}/agreements/${encodeURIComponent(kind)}.pdf`;
}

export function downloadSellerOrderDocument(token, orderId, kind) {
  return downloadAuthorizedPdf(
    token,
    orderDocumentPath("/api/auth/me/orders", orderId, kind),
    `${kind}-${String(orderId).slice(-6)}.pdf`,
  );
}

export function fetchSellerGestores(token) {
  return request("/api/auth/me/gestores", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function createSellerGestor(token, username) {
  return request("/api/auth/me/gestores", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ username }),
  });
}

export function deleteSellerGestor(token, gestorId) {
  return request(`/api/auth/me/gestores/${encodeURIComponent(gestorId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function fetchSellerGestorCatalogAccess(token) {
  return request("/api/auth/me/gestores/catalog-access", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function updateSellerGestorCatalogAccess(token, payload) {
  return request("/api/auth/me/gestores/catalog-access", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export function fetchSellerGestorCheckoutPhones(token) {
  return request("/api/auth/me/gestores/checkout-phones", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function updateSellerGestorCheckoutPhones(token, payload) {
  const body =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? payload
      : { gestor_ids: payload, include_store_phone: true };
  return request("/api/auth/me/gestores/checkout-phones", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

export function fetchSellerGestorNetworkProducts(token) {
  return request("/api/auth/me/gestores/network-products", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
