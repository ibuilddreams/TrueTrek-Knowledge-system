// Browser-persisted list of course snapshots for visitors who aren't signed
// in (used by the guest cart and guest wishlist). Each entry is a small
// snapshot of the course — enough to render a card — and the real price and
// availability are always re-checked by the backend after the list has been
// merged into the student's server-side list on sign-in.

const EMPTY = Object.freeze([]);

function toSnapshot(course) {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: (course.description || "").slice(0, 300),
    image: course.image || null,
    amount: course.amount,
    difficulty: course.difficulty,
    grade_label: course.grade_label || null,
    duration_minutes: course.duration_minutes || 0,
    category: course.category
      ? { id: course.category.id, name: course.category.name }
      : null,
  };
}

export function createGuestCourseStore(storageKey) {
  let cachedRaw;
  let cachedItems = EMPTY;
  let memoryOnly = false;
  const listeners = new Set();

  function readRaw() {
    try {
      return window.localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  }

  // Returns a referentially stable array until the stored value changes, as
  // required by useSyncExternalStore.
  function getSnapshot() {
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

  function getServerSnapshot() {
    return EMPTY;
  }

  function persist(items) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(items));
      memoryOnly = false;
    } catch {
      // Storage blocked or full — keep the in-memory view for this session.
      memoryOnly = true;
      cachedItems = items;
    }
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener) {
    listeners.add(listener);
    const onStorage = (event) => {
      if (event.key === storageKey) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  function add(course) {
    const items = getSnapshot();
    if (items.some((item) => item.id === course.id)) return;
    persist([...items, toSnapshot(course)]);
  }

  function remove(courseId) {
    persist(getSnapshot().filter((item) => item.id !== courseId));
  }

  function clear() {
    persist([]);
  }

  return { getSnapshot, getServerSnapshot, subscribe, add, remove, clear };
}
