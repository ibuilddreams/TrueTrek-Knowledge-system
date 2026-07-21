/**
 * Central Fetch API client with credentials + auth-ready interceptors.
 */

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

/**
 * @param {string} path
 * @param {{ method?: string, body?: any, headers?: Record<string,string>, skipAuth?: boolean, credentials?: RequestCredentials }} [options]
 */
export async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    body,
    headers = {},
    skipAuth = false,
    credentials = "include",
    ...rest
  } = options;

  let config = {
    path,
    method,
    body,
    headers: { ...DEFAULT_HEADERS, ...headers },
    credentials,
    skipAuth,
    ...rest,
  };

  config = await runRequestInterceptors(config);

  // Future: when using bearer tokens from a BFF, attach here if !skipAuth.
  // HttpOnly cookie auth relies on credentials: "include".

  const response = await fetch(config.path, {
    method: config.method,
    headers: config.headers,
    credentials: config.credentials,
    body:
      config.body !== undefined && config.body !== null
        ? typeof config.body === "string"
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
      data?.error || data?.details || `Request failed (${response.status})`
    );
    error.status = response.status;
    error.data = data;
    error.response = response;

    if (response.status === 401 && !skipAuth) {
      error.code = "UNAUTHORIZED";
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

export default apiClient;
