export function getApiErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  const body = error?.data;
  if (body && typeof body === "object") {
    const fieldErrors = body.data;
    if (fieldErrors && typeof fieldErrors === "object" && !Array.isArray(fieldErrors)) {
      const firstValue = Object.values(fieldErrors)[0];
      if (Array.isArray(firstValue) && typeof firstValue[0] === "string") {
        return firstValue[0];
      }
      if (typeof firstValue === "string" && firstValue) {
        return firstValue;
      }
    }
    if (typeof body.message === "string" && body.message) return body.message;
  }
  return error?.message || fallback;
}
