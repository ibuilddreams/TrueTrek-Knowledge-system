"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  openClassWhiteboard,
  setClassWhiteboardAccess,
} from "@/services/classSessionsService";
import { getApiErrorMessage } from "@/lib/apiErrors";

/**
 * Owns one Agora Interactive Whiteboard room for one class session.
 *
 * The sibling of `useAgoraCall`, and deliberately shaped like it: everything
 * to do with the SDK lives here so the classroom components stay ordinary
 * React, the server is the only source of a room and a token, and "renew" is
 * simply the same call again. The two are separate hooks because they are
 * separate products with separate failure modes — a classroom whose video is
 * fine and whose board cannot be reached has to say exactly that, not go dark.
 *
 * Whether this user may *draw* is decided by the server, in the role it signs
 * into the room token (`class_sessions/services.py::whiteboard_role`). A
 * reader is refused by Netless itself, so nothing here is a security control:
 * `isWritable` below is how the page behaves, not what it is allowed to do.
 */

export const BOARD_STATUS = {
  IDLE: "idle",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  ERROR: "error",
};

export const WHITEBOARD_ACCESS = {
  HOST_ONLY: "HOST_ONLY",
  EVERYONE: "EVERYONE",
};

// The key the teacher's client writes into the board's own shared state when
// they hand the pen over. The server is the authority — it is what signs the
// tokens — but a student already sitting in the room would otherwise have no
// way of hearing about the change short of polling for it, and this arrives
// over the connection they already have, the moment it happens.
const ACCESS_STATE_KEY = "truetrekWhiteboardAccess";

// Where `scripts/copy-whiteboard-sdk.mjs` vendors the SDK's browser bundle.
const SDK_URL = "/vendor/white-web-sdk.iife.js";

/**
 * Loads the whiteboard SDK from a <script> tag rather than importing it.
 *
 * This looks like a workaround and is in fact the only thing that works.
 * `white-web-sdk` still calls `ReactDOM.render`, which **React 19 removed**,
 * and Next.js aliases `react-dom` to the application's copy for every module
 * in the bundle — so the `react@16` npm installs beside the SDK can never
 * reach it, and `new WhiteWebSdk(...)` dies on `(0, wl.render) is not a
 * function`. The package's `index.iife.js` has React 16 compiled into it and
 * imports nothing, so loaded this way it brings its own React and the app
 * keeps React 19. The two never meet: the board renders into a plain DOM node
 * we hand it (`room.bindHtmlElement`), not into our React tree.
 *
 * Loading it here rather than at the top of the module is deliberate for the
 * same reason the Agora RTC SDK is imported lazily in `useAgoraCall`: it
 * reads `window`, it is 2.8 MB, and a class that never opens a board should
 * never pay for it. The promise is cached, so re-opening is instant.
 */
let sdkPromise = null;
function loadWhiteboard() {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("The whiteboard can only be opened in a browser."));
      return;
    }
    if (window.WhiteWebSdk) {
      resolve(window.WhiteWebSdk);
      return;
    }

    // Reuse a tag from an earlier attempt rather than appending a second copy
    // of a 2.8 MB script — two opens in quick succession would otherwise
    // download it twice.
    const existing = document.querySelector(`script[src="${SDK_URL}"]`);
    const script = existing || document.createElement("script");

    const onLoad = () => {
      if (window.WhiteWebSdk) resolve(window.WhiteWebSdk);
      else onError();
    };
    const onError = () => {
      // Cleared so a later attempt can retry: a cached rejected promise would
      // make one failed download permanent for the rest of the session.
      sdkPromise = null;
      script.remove();
      reject(
        new Error(
          "The whiteboard didn't load. Reload the page, and if it keeps happening " +
            "tell an administrator the whiteboard SDK is missing from this server.",
        ),
      );
    };

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });

    if (!existing) {
      script.src = SDK_URL;
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return sdkPromise;
}

/**
 * The IIFE bundle exports the `WhiteWebSdk` class with every named export
 * copied onto it, where the module build puts them side by side. Reading them
 * off the class keeps the rest of this hook written against one shape
 * whichever way the SDK arrived.
 */
function sdkExports(WhiteWebSdk) {
  return {
    WhiteWebSdk,
    ApplianceNames: WhiteWebSdk.ApplianceNames,
    DeviceType: WhiteWebSdk.DeviceType,
    ViewMode: WhiteWebSdk.ViewMode,
  };
}

/** The tools offered in the toolbar, named as the SDK names them. */
export const BOARD_TOOLS = {
  SELECTOR: "selector",
  PENCIL: "pencil",
  ERASER: "eraser",
  TEXT: "text",
  RECTANGLE: "rectangle",
  ELLIPSE: "ellipse",
  STRAIGHT: "straight",
  ARROW: "arrow",
  LASER: "laserPointer",
  HAND: "hand",
};

/** A hex string from the SDK's `[r, g, b]`, and back. */
function toRgb(hex) {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

/** Netless reports problems as plain errors; these are the ones a user can act on. */
function describeBoardError(error) {
  const message = error?.message || "";
  if (/room.*ban|banned/i.test(message)) {
    return "This whiteboard was closed by an administrator.";
  }
  if (/token/i.test(message) && /invalid|expired|verif/i.test(message)) {
    return "Your whiteboard pass expired. Close the board and open it again.";
  }
  if (/network|timeout|websocket/i.test(message)) {
    return "Lost the connection to the whiteboard. Check your network and try again.";
  }
  return message || "Could not open the whiteboard.";
}

export function useWhiteboard(sessionId) {
  const [status, setStatus] = useState(BOARD_STATUS.IDLE);
  const [error, setError] = useState(null);
  const [isWritable, setIsWritable] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [access, setAccess] = useState(WHITEBOARD_ACCESS.HOST_ONLY);
  const [isAccessSaving, setIsAccessSaving] = useState(false);

  const [tool, setToolState] = useState(BOARD_TOOLS.PENCIL);
  // Ink on a white canvas. The swatches offered in the toolbar are the
  // palette's own colours (`WhiteboardToolbar.PEN_COLOURS`); this is the one
  // the board opens on.
  const [strokeColor, setStrokeColorState] = useState("#101615");
  const [strokeWidth, setStrokeWidthState] = useState(4);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [isFollowingHost, setIsFollowingHost] = useState(false);

  const roomRef = useRef(null);
  const containerRef = useRef(null);
  // Join and leave are queued rather than allowed to overlap, for exactly the
  // reason `useAgoraCall` queues them: React's development double-mount opens
  // and closes within a frame, and disconnecting a room that is still
  // negotiating leaves the SDK mid-handshake.
  const operationRef = useRef(null);
  const sessionIdRef = useRef(sessionId);
  // Read inside SDK callbacks, which are bound once at join time and would
  // otherwise close over the first render's values forever.
  const isWritableRef = useRef(false);
  const isHostRef = useRef(false);
  const reopenRef = useRef(null);
  // Bumped on every open. The SDK's callbacks are bound before `joinRoom`
  // resolves, so a room has no identity to compare against from inside its
  // own handlers — and a room torn down during a re-join goes on emitting
  // for a moment afterwards. Without this, the old room's "disconnected"
  // lands on the new one and closes a board that just opened fine.
  const generationRef = useRef(0);
  // The pen, as refs. `runOpen` sets the board's initial member state from
  // these rather than from the state values: reading the state would give
  // `open` a new identity on every colour change, and the panel's mount
  // effect calls `open` — so every tap on a swatch would queue another join.
  // Refs also mean re-joining after the pen was handed over keeps the colour
  // and width the user had already chosen.
  const strokeColorRef = useRef("#101615");
  const strokeWidthRef = useRef(4);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    isWritableRef.current = isWritable;
  }, [isWritable]);

  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  const enqueue = useCallback((task) => {
    const previous = operationRef.current || Promise.resolve();
    // Never left in a rejected state: a board that failed to open must still
    // be closable, and every later operation would otherwise be skipped.
    const next = previous.then(task, task);
    operationRef.current = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }, []);

  /** Mirrors the room's state into React. Called on join and on every change. */
  const syncFromRoom = useCallback((room) => {
    if (!room) return;
    const sceneState = room.state?.sceneState;
    if (sceneState) {
      setPageIndex(sceneState.index ?? 0);
      setPageCount(sceneState.scenes?.length ?? 1);
    }
    const memberState = room.state?.memberState;
    if (memberState?.currentApplianceName) {
      setToolState(memberState.currentApplianceName);
    }
    // Undo/redo are deliberately *not* read back from the room either.
    // `room.canRedoSteps` does not report what it says: measured against a
    // live room it simply mirrors `canUndoSteps`, so after undoing twice it
    // claims 0 redo steps when there are 2, and after clearing a page it
    // claims 2 when the clear has just discarded the redo stack. The
    // `onCanUndoStepsUpdate` / `onCanRedoStepsUpdate` callbacks carry the
    // true values, and they fire on every change — so reading the properties
    // here would do nothing but overwrite a correct state with a wrong one
    // the next time the camera or the page moved.
    //
    // Follow mode is deliberately *not* read back from the room. For a
    // read-only participant the SDK applies `setViewMode(Follower)` straight
    // to the view without touching `broadcastState`, so the room would keep
    // reporting the mode they were never in — and the button would be wrong
    // for exactly the people it exists for. It is owned locally instead, set
    // where we set the view mode.
  }, []);

  const runClose = useCallback(async (nextStatus = BOARD_STATUS.IDLE) => {
    const room = roomRef.current;
    roomRef.current = null;

    if (room) {
      try {
        // Unbinding first: `disconnect` tears the room down, and a canvas
        // still attached to a node React is about to unmount throws on the
        // way out.
        room.bindHtmlElement(null);
      } catch {
        // Already unbound.
      }
      try {
        await room.disconnect();
      } catch {
        // Already disconnected — nothing left to tidy up on this side.
      }
    }

    setStatus(nextStatus);
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  const close = useCallback(
    (nextStatus) => enqueue(() => runClose(nextStatus)),
    [enqueue, runClose],
  );

  const runOpen = useCallback(async () => {
    // Already on the board — a second "open", or the remount half of React's
    // double-mount, is a no-op.
    if (roomRef.current) return;
    const generation = ++generationRef.current;
    const isCurrent = () => generationRef.current === generation;
    setStatus(BOARD_STATUS.CONNECTING);
    setError(null);

    let credentials;
    try {
      const response = await openClassWhiteboard(sessionIdRef.current);
      credentials = response?.data;
    } catch (openError) {
      setStatus(BOARD_STATUS.ERROR);
      setError(
        getApiErrorMessage(openError, "The whiteboard isn't available for this class."),
      );
      return;
    }

    const writable = Boolean(credentials?.writable);
    const host = Boolean(credentials?.is_host);

    try {
      const { WhiteWebSdk, ApplianceNames, DeviceType, ViewMode } = sdkExports(
        await loadWhiteboard(),
      );

      const sdk = new WhiteWebSdk({
        appIdentifier: credentials.app_identifier,
        // Both the App Identifier and the region come from the server beside
        // the token rather than from the frontend's environment: a token,
        // the app it was signed under and the data centre its room lives in
        // only work as a set, and splitting them across two deployments is
        // how a board half-works against the wrong environment.
        region: credentials.region,
        deviceType: DeviceType.Surface,
        loggerOptions: {
          // Turns off the SDK's local log persistence, which is the only
          // thing that reaches for `agora-foundation/lib/logger`. That
          // package is an optional peer dependency nobody installs (npm
          // cannot even resolve the version it asks for), so leaving this on
          // means every board open prints a red "agora-foundation logger
          // worker unavailable" into the console before falling back. We
          // keep no local whiteboard logs and upload none, so there is
          // nothing to lose by switching it off.
          localLog: { enabled: false, enabledUpload: false },
        },
      });

      const room = await sdk.joinRoom(
        {
          uuid: credentials.room_uuid,
          roomToken: credentials.room_token,
          uid: credentials.uid,
          region: credentials.region,
          // Netless's read-only mode: a reader's pointer pans and zooms the
          // board but leaves no marks. Deliberately *not* paired with
          // `disableDeviceInputs`, which would also take their camera away —
          // a student who steps out of follow mode to read something has to
          // be able to move around, and their drawing is refused by the
          // server anyway (the token says `reader`).
          isWritable: writable,
          // The selection float bar is only meaningful to someone who can
          // move what they selected.
          floatBar: writable,
          userPayload: { uid: credentials.uid, name: credentials.display_name },
        },
        {
          onPhaseChanged: (phase) => {
            if (phase === "disconnected" && isCurrent() && roomRef.current) {
              setError("The whiteboard disconnected. Open it again to carry on.");
              close(BOARD_STATUS.ERROR);
            }
          },
          onRoomStateChanged: () => {
            const current = roomRef.current;
            if (!current || !isCurrent()) return;
            syncFromRoom(current);

            // The teacher handing the pen over, heard the moment it happens
            // over the connection we already have. The server has already
            // been told — it is what signs the tokens — so all this does is
            // send us back for one that matches.
            const announced = current.state?.globalState?.[ACCESS_STATE_KEY];
            if (!announced) return;
            setAccess(announced);
            const shouldBeWritable =
              announced === WHITEBOARD_ACCESS.EVERYONE || isHostRef.current;
            if (shouldBeWritable !== isWritableRef.current) {
              // Bumping the generation here, rather than waiting for the
              // re-join to do it, is what stops a burst of state changes
              // queueing a second and third re-join behind the first:
              // `isWritableRef` only catches up once one has finished.
              generationRef.current += 1;
              reopenRef.current?.();
            }
          },
          onCanUndoStepsUpdate: (steps) => isCurrent() && setCanUndo(steps > 0),
          onCanRedoStepsUpdate: (steps) => isCurrent() && setCanRedo(steps > 0),
          onDisconnectWithError: (disconnectError) => {
            if (!isCurrent()) return;
            setError(describeBoardError(disconnectError));
            close(BOARD_STATUS.ERROR);
          },
          onKickedWithReason: () => {
            if (!isCurrent()) return;
            setError("You were removed from the whiteboard.");
            close(BOARD_STATUS.ERROR);
          },
        },
      );

      roomRef.current = room;
      setIsWritable(writable);
      setIsHost(host);
      setAccess(credentials.access || WHITEBOARD_ACCESS.HOST_ONLY);

      if (containerRef.current) {
        room.bindHtmlElement(containerRef.current);
      }

      if (writable) {
        // Undo, redo, copy, paste and duplicate are **off by default**:
        // `disableSerialization` ships as `true`, and while it is set the SDK
        // keeps its operation engine switched off entirely, so `canUndoSteps`
        // never leaves 0 and the toolbar's undo/redo sit permanently greyed
        // out. Turning it on is the whole of what makes them work.
        //
        // Netless's warning about this flag is that a room containing anyone
        // on white-web-sdk older than 2.9.3 breaks when it is cleared. Every
        // client here loads the one bundle this repo vendors, so there is no
        // version spread to worry about.
        //
        // Writers only: the setter runs through `isEnableModify()`, which
        // throws rather than no-ops for a read-only room.
        room.disableSerialization = false;

        room.setMemberState({
          currentApplianceName: ApplianceNames.pencil,
          strokeColor: toRgb(strokeColorRef.current),
          textColor: toRgb(strokeColorRef.current),
          strokeWidth: strokeWidthRef.current,
        });
      }

      // The teacher drives the view and the class follows it, which is what
      // makes this a board somebody is *presenting on* rather than a shared
      // sheet everyone is lost on. Wrapped because `setViewMode` writes to
      // room state: a reader is entitled to be refused, and a student with a
      // free camera is a smaller problem than a board that failed to open.
      try {
        room.setViewMode(host ? ViewMode.Broadcaster : ViewMode.Follower);
        setIsFollowingHost(!host);
      } catch {
        // Only `Broadcaster` is refused for a non-writable room, so this is
        // the co-host case rather than the student one; left in free mode,
        // and the "Follow teacher" button is still offered.
        setIsFollowingHost(false);
      }

      syncFromRoom(room);
      setStatus(BOARD_STATUS.CONNECTED);
    } catch (boardError) {
      setError(describeBoardError(boardError));
      // `runClose`, not the queued `close`: this already *is* the queued
      // operation, so queueing the teardown behind itself would deadlock.
      await runClose(BOARD_STATUS.ERROR);
    }
  }, [close, runClose, syncFromRoom]);

  const open = useCallback(() => enqueue(runOpen), [enqueue, runOpen]);

  // Leaving and re-entering with a token at the new role — the only way to
  // change what Netless will let this browser do, because writability is
  // carried in the token rather than asked for by the page.
  const reopen = useCallback(
    () =>
      enqueue(async () => {
        await runClose(BOARD_STATUS.CONNECTING);
        await runOpen();
      }),
    [enqueue, runClose, runOpen],
  );

  useEffect(() => {
    reopenRef.current = reopen;
  }, [reopen]);

  // ---------------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------------

  const withRoom = useCallback((action) => {
    const room = roomRef.current;
    if (!room || !isWritableRef.current) return;
    try {
      action(room);
    } catch {
      // The board closed underneath the button, or the server refused a
      // write we thought we were entitled to make. Either way the board
      // itself is still on screen and usable.
    }
  }, []);

  const setTool = useCallback(
    (nextTool) => {
      setToolState(nextTool);
      withRoom((room) => room.setMemberState({ currentApplianceName: nextTool }));
    },
    [withRoom],
  );

  const setStrokeColor = useCallback(
    (hex) => {
      setStrokeColorState(hex);
      strokeColorRef.current = hex;
      withRoom((room) =>
        // `textColor` alongside `strokeColor` so the colour swatches mean the
        // same thing whichever tool is selected — picking red and then typing
        // should not produce black text.
        room.setMemberState({ strokeColor: toRgb(hex), textColor: toRgb(hex) }),
      );
    },
    [withRoom],
  );

  const setStrokeWidth = useCallback(
    (width) => {
      setStrokeWidthState(width);
      strokeWidthRef.current = width;
      withRoom((room) => room.setMemberState({ strokeWidth: width }));
    },
    [withRoom],
  );

  const undo = useCallback(() => withRoom((room) => room.undo()), [withRoom]);
  const redo = useCallback(() => withRoom((room) => room.redo()), [withRoom]);
  const clearPage = useCallback(
    () => withRoom((room) => room.cleanCurrentScene()),
    [withRoom],
  );

  // ---------------------------------------------------------------------
  // Pages
  // ---------------------------------------------------------------------

  const addPage = useCallback(
    () =>
      withRoom((room) => {
        const next = (room.state?.sceneState?.index ?? 0) + 1;
        // An unnamed scene: Netless names it, and nothing in this UI shows a
        // page's name, so inventing one only risks a collision.
        room.putScenes("/", [{}], next);
        room.setSceneIndex(next);
      }),
    [withRoom],
  );

  const removePage = useCallback(
    () =>
      withRoom((room) => {
        const sceneState = room.state?.sceneState;
        // A board always has somewhere to draw: the last page is cleared
        // rather than removed, which is also what the button says it does.
        if (!sceneState || (sceneState.scenes?.length ?? 1) <= 1) {
          room.cleanCurrentScene();
          return;
        }
        room.removeScenes(sceneState.scenePath);
      }),
    [withRoom],
  );

  /** Page navigation is a view change, so a reader may do it too. */
  const goToPage = useCallback((index) => {
    const room = roomRef.current;
    if (!room) return;
    try {
      room.setSceneIndex(index);
    } catch {
      // A reader's page turn is a write to shared state and may be refused;
      // the page they are on is unchanged, which is a correct outcome.
    }
  }, []);

  const previousPage = useCallback(() => goToPage(Math.max(0, pageIndex - 1)), [goToPage, pageIndex]);
  const nextPage = useCallback(
    () => goToPage(Math.min(pageCount - 1, pageIndex + 1)),
    [goToPage, pageCount, pageIndex],
  );

  // ---------------------------------------------------------------------
  // View
  // ---------------------------------------------------------------------

  /**
   * Re-measures the canvas after the layout around it moved.
   *
   * The SDK watches the bound node with a ResizeObserver and usually needs no
   * help, but the toolbar appearing (a student handed the pen) and the
   * participants panel sliding in both resize the board in the same frame
   * React re-renders it, and a board drawing at the wrong scale puts every
   * stroke somewhere other than where the pointer was.
   */
  const refreshView = useCallback(() => {
    try {
      roomRef.current?.refreshViewSize();
    } catch {
      // Not bound yet; the observer will catch the next change.
    }
  }, []);

  const resetView = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    try {
      room.moveCamera({ centerX: 0, centerY: 0, scale: 1, animationMode: "continuous" });
    } catch {
      // Nothing to recentre.
    }
  }, []);

  const toggleFollowHost = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const { ViewMode } = sdkExports(await loadWhiteboard());
    const next = !isFollowingHost;
    try {
      room.setViewMode(next ? ViewMode.Follower : ViewMode.Freedom);
      setIsFollowingHost(next);
    } catch {
      // Refused; leave the button showing the mode we are actually in.
    }
  }, [isFollowingHost]);

  // ---------------------------------------------------------------------
  // Who may draw
  // ---------------------------------------------------------------------

  const changeAccess = useCallback(
    async (nextAccess) => {
      setIsAccessSaving(true);
      try {
        // The server first, because it is what signs the tokens: a board that
        // announced the change and then failed to persist it would hand the
        // class a pen that Netless refuses.
        await setClassWhiteboardAccess(sessionIdRef.current, nextAccess);
        setAccess(nextAccess);

        const room = roomRef.current;
        if (room && isWritableRef.current) {
          try {
            room.setGlobalState({ [ACCESS_STATE_KEY]: nextAccess });
          } catch {
            // The announcement is an optimisation, never the record: a
            // student who misses it still gets the right token the next time
            // they open the board.
          }
        }
      } catch (accessError) {
        setError(getApiErrorMessage(accessError, "Couldn't change who may draw."));
      } finally {
        setIsAccessSaving(false);
      }
    },
    [],
  );

  // Closing the classroom, navigating away or unmounting must all disconnect
  // the room — a board left connected keeps the class's seat occupied and
  // keeps receiving every stroke drawn in it.
  useEffect(() => {
    return () => {
      close();
    };
    // Intentionally mount-only: `close` reads everything it needs from refs,
    // and re-running this on every render would shut the board.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    containerRef,
    status,
    error,
    open,
    close,
    isWritable,
    isHost,
    access,
    isAccessSaving,
    changeAccess,
    tool,
    setTool,
    strokeColor,
    setStrokeColor,
    strokeWidth,
    setStrokeWidth,
    canUndo,
    canRedo,
    undo,
    redo,
    clearPage,
    pageIndex,
    pageCount,
    addPage,
    removePage,
    previousPage,
    nextPage,
    isFollowingHost,
    toggleFollowHost,
    resetView,
    refreshView,
    clearError: () => setError(null),
  };
}
