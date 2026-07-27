/**
 * Central Fetch API client with credentials + auth-ready interceptors.
 */

import { API_BASE_URL } from "@/config/env";
import { AUTH_COOKIE } from "@/constants/auth";
import {
  getClientCookie,
  removeClientCookie,
  setClientCookie,
} from "@/utils/cookies";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

/** @type {Array<(config: object) => object | Promise<object>>} */
const requestInterceptors = [];

/** @type {Array<(response: Response, data: any) => any | Promise<any>>} */
const responseInterceptors = [];

/** @type {Array<(error: Error) => never | Promise<never>>} */
const errorInterceptors = [];

export function addRequestInterceptor(fn) {
  requestInterceptors.push(fn);
  return () => {
    const idx = requestInterceptors.indexOf(fn);
    if (idx >= 0) requestInterceptors.splice(idx, 1);
  };
}

export function addResponseInterceptor(fn) {
  responseInterceptors.push(fn);
  return () => {
    const idx = responseInterceptors.indexOf(fn);
    if (idx >= 0) responseInterceptors.splice(idx, 1);
  };
}

export function addErrorInterceptor(fn) {
  errorInterceptors.push(fn);
  return () => {
    const idx = errorInterceptors.indexOf(fn);
    if (idx >= 0) errorInterceptors.splice(idx, 1);
  };
}

async function runRequestInterceptors(config) {
  let next = config;
  for (const interceptor of requestInterceptors) {
    next = await interceptor(next);
  }
  return next;
}

async function runResponseInterceptors(response, data) {
  let next = data;
  for (const interceptor of responseInterceptors) {
    next = await interceptor(response, next);
  }
  return next;
}

async function runErrorInterceptors(error) {
  let current = error;
  for (const interceptor of errorInterceptors) {
    try {
      await interceptor(current);
    } catch (nextError) {
      current = nextError;
    }
  }
  throw current;
}

let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = getClientCookie(AUTH_COOKIE.REFRESH_TOKEN);
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: "POST",
        headers: DEFAULT_HEADERS,
        credentials: "include",
        body: JSON.stringify({ refresh: refreshToken }),
      });

      const data = await response.json().catch(() => null);
      const accessToken = data?.data?.access;

      if (!response.ok || !accessToken) {
        throw new Error(data?.message || "Session expired");
      }

      setClientCookie(AUTH_COOKIE.ACCESS_TOKEN, accessToken);
      return accessToken;
    })();
  }

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

function clearAuthCookies() {
  removeClientCookie(AUTH_COOKIE.ACCESS_TOKEN);
  removeClientCookie(AUTH_COOKIE.REFRESH_TOKEN);
  removeClientCookie(AUTH_COOKIE.USER);
}

/**
 * @param {string} path
 * @param {{ method?: string, body?: any, headers?: Record<string,string>, skipAuth?: boolean, credentials?: RequestCredentials, baseUrl?: string }} [options]
 */
export async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    body,
    headers = {},
    skipAuth = false,
    credentials = "include",
    baseUrl = "",
    _retried = false,
    ...rest
  } = options;

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  let config = {
    path: `${baseUrl}${path}`,
    method,
    body,
    headers: isFormData
      ? { Accept: "application/json", ...headers }
      : { ...DEFAULT_HEADERS, ...headers },
    credentials,
    skipAuth,
    baseUrl,
    ...rest,
  };

  config = await runRequestInterceptors(config);

  if (config.baseUrl === API_BASE_URL && !config.skipAuth) {
    const accessToken = getClientCookie(AUTH_COOKIE.ACCESS_TOKEN);
    if (accessToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${accessToken}`,
      };
    }
  }

  const response = await fetch(config.path, {
    method: config.method,
    headers: config.headers,
    credentials: config.credentials,
    body:
      config.body !== undefined && config.body !== null
        ? typeof config.body === "string" ||
          (typeof FormData !== "undefined" && config.body instanceof FormData)
          ? config.body
          : JSON.stringify(config.body)
        : undefined,
    ...rest,
  });

  let data = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const error = new Error(
      data?.message ||
        data?.error ||
        data?.details ||
        `Request failed (${response.status})`
    );
    error.status = response.status;
    error.data = data;
    error.response = response;

    const isAuthEndpoint = path.includes("/auth/login") || path.includes("/auth/refresh");
    const hasRefreshToken = Boolean(getClientCookie(AUTH_COOKIE.REFRESH_TOKEN));

    if (
      response.status === 401 &&
      !skipAuth &&
      !isAuthEndpoint &&
      !_retried &&
      config.baseUrl === API_BASE_URL &&
      hasRefreshToken
    ) {
      try {
        await refreshAccessToken();
        return apiRequest(path, { ...options, _retried: true });
      } catch {
        clearAuthCookies();
        error.code = "SESSION_EXPIRED";
        return runErrorInterceptors(error);
      }
    }

    if (response.status === 401 && !skipAuth) {
      error.code = isAuthEndpoint || !hasRefreshToken ? "UNAUTHORIZED" : "SESSION_EXPIRED";
    }

    return runErrorInterceptors(error);
  }

  return runResponseInterceptors(response, data);
}

export const apiClient = {
  get: (path, options) => apiRequest(path, { ...options, method: "GET" }),
  post: (path, body, options) =>
    apiRequest(path, { ...options, method: "POST", body }),
  put: (path, body, options) =>
    apiRequest(path, { ...options, method: "PUT", body }),
  patch: (path, body, options) =>
    apiRequest(path, { ...options, method: "PATCH", body }),
  delete: (path, options) =>
    apiRequest(path, { ...options, method: "DELETE" }),
};

export const backendClient = {
  get: (path, options) =>
    apiRequest(path, { ...options, method: "GET", baseUrl: API_BASE_URL }),
  post: (path, body, options) =>
    apiRequest(path, {
      ...options,
      method: "POST",
      body,
      baseUrl: API_BASE_URL,
    }),
  put: (path, body, options) =>
    apiRequest(path, {
      ...options,
      method: "PUT",
      body,
      baseUrl: API_BASE_URL,
    }),
  patch: (path, body, options) =>
    apiRequest(path, {
      ...options,
      method: "PATCH",
      body,
      baseUrl: API_BASE_URL,
    }),
  delete: (path, options) =>
    apiRequest(path, { ...options, method: "DELETE", baseUrl: API_BASE_URL }),
};

export default apiClient;
