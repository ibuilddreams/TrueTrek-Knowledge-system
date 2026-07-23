export function getApiErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  const data = error?.data;
  if (data && typeof data === "object") {
    if (typeof data.message === "string" && data.message) return data.message;
    const firstValue = Object.values(data)[0];
    if (Array.isArray(firstValue) && typeof firstValue[0] === "string") {
      return firstValue[0];
    }
  }
  return error?.message || fallback;
}
