// Browser-persisted cart for visitors who aren't signed in. Each entry is a
// small snapshot of the course (enough to render the cart page) — the real
// price and availability are always re-checked by the backend at checkout,
// after the guest cart has been merged into the student's server cart.

const STORAGE_KEY = "truetrek-guest-cart";
const EMPTY = Object.freeze([]);

let cachedRaw;
let cachedItems = EMPTY;
let memoryOnly = false;
const listeners = new Set();

function toSnapshot(course) {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: (course.description || "").slice(0, 300),
    image: course.image || null,
    amount: course.amount,
    difficulty: course.difficulty,
    category: course.category
      ? { id: course.category.id, name: course.category.name }
      : null,
  };
}

function readRaw() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

// Returns a referentially stable array until the stored value changes, as
// required by useSyncExternalStore.
export function getGuestCartSnapshot() {
  if (typeof window === "undefined") return EMPTY;
  if (memoryOnly) return cachedItems;
  const raw = readRaw();
  if (raw === cachedRaw) return cachedItems;

  cachedRaw = raw;
  try {
    const parsed = JSON.parse(raw || "[]");
    cachedItems = Array.isArray(parsed)
      ? parsed.filter((item) => item && item.id && item.title)
      : EMPTY;
  } catch {
    cachedItems = EMPTY;
  }
  return cachedItems;
}

export function getGuestCartServerSnapshot() {
  return EMPTY;
}

function persist(items) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    memoryOnly = false;
  } catch {
    // Storage blocked or full — keep the in-memory view for this session.
    memoryOnly = true;
    cachedItems = items;
  }
  listeners.forEach((listener) => listener());
}

export function subscribeGuestCart(listener) {
  listeners.add(listener);
  const onStorage = (event) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function addToGuestCart(course) {
  const items = getGuestCartSnapshot();
  if (items.some((item) => item.id === course.id)) return;
  persist([...items, toSnapshot(course)]);
}

export function removeFromGuestCart(courseId) {
  persist(getGuestCartSnapshot().filter((item) => item.id !== courseId));
}

export function clearGuestCart() {
  persist([]);
}
