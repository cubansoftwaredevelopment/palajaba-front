import { getUserFacingMessage } from '../shared/utils/userFacingError.js'
import { cachedRead, dropSend, enqueueSend, holdSend, releaseHold, rememberRead } from '../syncManager/index.js'

/** En dev usa rutas relativas → proxy de Vite. En prod usa VITE_API_URL. */
export function getApiBase() {
  if (import.meta.env.DEV) return "";
  return import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8081";
}

export const NETWORK_ERROR_CODE = "network_error";

export class ApiError extends Error {
  constructor(message, { code = null, data = null, status = null } = {}) {
    super(
      getUserFacingMessage(
        { message, code, status },
        "Ocurrió un error. Intenta de nuevo.",
      ),
    );
    this.name = "ApiError";
    this.code = code;
    this.data = data;
    this.status = status;
  }
}

function mapValidationMessage(msg) {
  const text = String(msg || "").trim();
  if (!text) return "Revisa los datos e inténtalo de nuevo.";
  if (/field required|field_required|missing/i.test(text)) {
    return "Falta un dato obligatorio.";
  }
  const minChars = text.match(/at least (\d+) characters/i);
  if (minChars) {
    return `Este campo debe tener al menos ${minChars[1]} caracteres.`;
  }
  if (/valid email|email address/i.test(text)) {
    return "Ingresa un correo válido.";
  }
  if (/input should be|value is not a valid|type_error/i.test(text)) {
    return "Hay un dato con formato incorrecto.";
  }
  return getUserFacingMessage({ message: text }, "Revisa los datos e inténtalo de nuevo.");
}

export function parseApiErrorDetail(detail) {
  if (typeof detail === "string") {
    return { message: detail, code: null, data: null };
  }

  if (detail && typeof detail === "object" && !Array.isArray(detail)) {
    return {
      message: detail.message || "Ocurrió un error. Intenta de nuevo.",
      code: detail.code || null,
      data: detail,
    };
  }

  if (Array.isArray(detail)) {
    return {
      message: detail
        .map((item) => {
          if (typeof item === "string") return item;
          if (item?.msg) {
            const field = Array.isArray(item.loc)
              ? item.loc.filter((p) => p !== "body").join(".")
              : "";
            if (
              field.endsWith("phone_primary") &&
              (item.type === "string_too_short" ||
                item.type === "phone_primary_too_short" ||
                /at least 8 characters/i.test(item.msg))
            ) {
              return "Ingresa un teléfono de contacto con al menos 8 caracteres.";
            }
            if (
              field === "password" ||
              field.endsWith(".password")
            ) {
              if (
                item.type === "string_too_short" ||
                /at least 6 characters/i.test(item.msg) ||
                /al menos 6 caracteres/i.test(item.msg)
              ) {
                return "La contraseña debe tener al menos 6 caracteres.";
              }
            }
            return mapValidationMessage(item.msg);
          }
          return "Revisa los datos e inténtalo de nuevo.";
        })
        .join(" "),
      code: null,
      data: null,
    };
  }

  return {
    message: "Ocurrió un error. Intenta de nuevo.",
    code: null,
    data: null,
  };
}

export async function parseApiError(response) {
  const data = await response.json().catch(() => ({}));
  return parseApiErrorDetail(data.detail).message;
}

export async function request(path, options = {}) {
  const { clientId, syncSkip, ...fetchOptions } = options;
  const headers = { ...fetchOptions.headers };
  const hasBody = fetchOptions.body != null && fetchOptions.body !== "";
  if (
    hasBody &&
    !headers["Content-Type"] &&
    !(fetchOptions.body instanceof FormData)
  ) {
    headers["Content-Type"] = "application/json";
  }

  const method = String(fetchOptions.method || "GET").toUpperCase();
  const tracked = !syncSkip;
  let syncId = null;
  if (tracked && method !== "GET") {
    syncId = clientId || (globalThis.crypto?.randomUUID?.() ?? `sync-${Date.now()}`);
    await enqueueSend({ id: syncId, path, method, headers, body: fetchOptions.body });
    holdSend(syncId);
  }

  let response;
  try {
    response = await fetch(`${getApiBase()}${path}`, {
      ...fetchOptions,
      method,
      headers,
    });
  } catch {
    releaseHold();
    if (tracked && method === "GET") {
      const cached = await cachedRead(path);
      if (cached !== undefined) return cached;
    }
    throw new ApiError("Error de conexión", { code: NETWORK_ERROR_CODE });
  }

  if (!response.ok) {
    if (syncId) await dropSend(syncId);
    releaseHold();
    const data = await response.json().catch(() => ({}));
    const parsed = parseApiErrorDetail(data.detail);
    const fallback =
      response.status === 404
        ? "No encontramos lo que buscabas."
        : response.status >= 500
          ? "El servicio no está disponible en este momento."
          : "Ocurrió un error. Intenta de nuevo.";
    const message =
      parsed.message === "Ocurrió un error. Intenta de nuevo."
        ? fallback
        : parsed.message;
    throw new ApiError(message, {
      code: parsed.code,
      data: parsed.data,
      status: response.status,
    });
  }

  if (syncId) await dropSend(syncId);
  releaseHold();

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json();
  if (tracked && method === "GET") await rememberRead(path, payload);
  return payload;
}
