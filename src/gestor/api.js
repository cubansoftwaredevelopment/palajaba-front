import { request } from '../api/client.js'

export function gestorLogin({ store_name, username, password }) {
  const body = {
    store_name,
    username,
  };
  if (password) {
    body.password = password;
  }
  return request("/api/gestores/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function gestorSetup({ setup_token, password, phone }) {
  return request("/api/gestores/setup", {
    method: "POST",
    body: JSON.stringify({ setup_token, password, phone }),
  });
}

export function fetchGestorMe(token) {
  return request("/api/gestores/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function fetchGestorAllowedProducts(token) {
  return request("/api/gestores/me/allowed-products", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function updateGestorSelectedProducts(token, products) {
  return request("/api/gestores/me/selected-products", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ products }),
  });
}
