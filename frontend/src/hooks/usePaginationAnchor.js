"use client";

import { useCallback, useRef } from "react";

// The pager sits at the *bottom* of a long list, so a plain setPage leaves the
// reader scrolled past the first rows of the page they just opened — page 2
// starts somewhere in its middle. This brings the top of the list back into
// view when the page changes.
//
// Usage: const [listRef, handlePageChange] = usePaginationAnchor(setPage);
// put listRef on the element the results start with (give it `scroll-mt-28` so
// the sticky navbar doesn't cover it) and pass handlePageChange to
// <Pagination onPageChange> — or to a hand-rolled pager's buttons.
//
// Only scrolls when the anchor is at or above the sticky navbar, so the
// movement is always upward: a short list whose pager is already on screen
// stays where it is instead of jumping down.
const STICKY_HEADER_OFFSET = 112; // px — matches the anchor's scroll-mt-28.

export function usePaginationAnchor(setPage) {
  const anchorRef = useRef(null);

  const handlePageChange = useCallback(
    (nextPage) => {
      setPage(nextPage);
      const anchor = anchorRef.current;
      if (anchor && anchor.getBoundingClientRect().top < STICKY_HEADER_OFFSET) {
        anchor.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [setPage],
  );

  return [anchorRef, handlePageChange];
}
