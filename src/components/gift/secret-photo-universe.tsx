import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { createPortal } from "react-dom";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  BookOpenText,
  Copy,
  ImagePlus,
  Move,
  RefreshCw,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import {
  DUNG_DIARY_PASSCODE,
  SECRET_UNIVERSE_PASSCODE,
  secretUniversePhotos,
} from "@/content/secret-universe";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  getDiaryDraft,
  getDiaryEntries,
  getSharedDiaryCache,
  getSharedDiaryDraftCache,
  getSharedSyncItems,
  getUploadedPhotos,
  queueSharedSyncItem,
  removeSharedSyncItem,
  cacheSharedDiaryDraft,
  cacheSharedDiaryEntries,
  type DiaryDraft,
  type SharedSyncItem,
} from "@/lib/secret-local-data";
import {
  bootstrapSharedSpace,
  connectSharedSpace,
  createSharedSpaceInvite,
  getSharedDiary,
  getSharedSpaceConnection,
  listSharedPhotos,
  syncPendingSharedChanges,
  uploadSharedPhoto,
} from "@/lib/shared-secret-space";
import type {
  SecretCloudPhoto,
  SecretDiaryEntry,
  SharedSecretDiaryDraft,
} from "@/lib/secret-space-types";
import {
  getSecretDiary,
  listSecretPhotos,
} from "@/lib/secret-space";
import "./SecretPhotoUniverse.css";

type SecretPhoto = {
  id: string;
  src: string;
  alt: string;
  caption: string;
  uploaded: boolean;
};

type PhotoMotion = {
  x: number;
  y: number;
  z: number;
  phase: number;
  speed: number;
  orbitX: number;
  orbitY: number;
  dive: number;
  tilt: number;
  size: number;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  lastTime: number;
  yaw: number;
  pitch: number;
  photoIndex: number | null;
  dragging: boolean;
};

const PHOTO_MOTIONS: PhotoMotion[] = [
  {
    x: -0.34,
    y: -0.27,
    z: -310,
    phase: 0.2,
    speed: 0.24,
    orbitX: 0.11,
    orbitY: 0.09,
    dive: 130,
    tilt: -13,
    size: 0.88,
  },
  {
    x: 0.08,
    y: -0.34,
    z: 120,
    phase: 2.1,
    speed: 0.19,
    orbitX: 0.09,
    orbitY: 0.12,
    dive: 220,
    tilt: 9,
    size: 0.82,
  },
  {
    x: 0.37,
    y: -0.2,
    z: -120,
    phase: 1.1,
    speed: 0.31,
    orbitX: 0.12,
    orbitY: 0.08,
    dive: 170,
    tilt: 17,
    size: 0.92,
  },
  {
    x: -0.12,
    y: 0.02,
    z: 240,
    phase: 3.4,
    speed: 0.16,
    orbitX: 0.08,
    orbitY: 0.1,
    dive: 250,
    tilt: -8,
    size: 0.78,
  },
  {
    x: 0.27,
    y: 0.06,
    z: -390,
    phase: 4.1,
    speed: 0.27,
    orbitX: 0.14,
    orbitY: 0.1,
    dive: 120,
    tilt: 12,
    size: 0.92,
  },
  {
    x: -0.39,
    y: 0.28,
    z: 80,
    phase: 2.8,
    speed: 0.22,
    orbitX: 0.1,
    orbitY: 0.13,
    dive: 230,
    tilt: -18,
    size: 0.82,
  },
  {
    x: 0.02,
    y: 0.34,
    z: -210,
    phase: 5.3,
    speed: 0.34,
    orbitX: 0.12,
    orbitY: 0.08,
    dive: 180,
    tilt: 6,
    size: 0.9,
  },
  {
    x: 0.39,
    y: 0.31,
    z: 180,
    phase: 0.8,
    speed: 0.18,
    orbitX: 0.1,
    orbitY: 0.12,
    dive: 260,
    tilt: 14,
    size: 0.8,
  },
  {
    x: -0.08,
    y: -0.46,
    z: -80,
    phase: 4.7,
    speed: 0.29,
    orbitX: 0.13,
    orbitY: 0.08,
    dive: 190,
    tilt: -11,
    size: 0.84,
  },
  {
    x: 0.45,
    y: 0.02,
    z: -300,
    phase: 3.1,
    speed: 0.21,
    orbitX: 0.08,
    orbitY: 0.12,
    dive: 140,
    tilt: 19,
    size: 0.88,
  },
  {
    x: -0.44,
    y: -0.06,
    z: -40,
    phase: 5.8,
    speed: 0.26,
    orbitX: 0.12,
    orbitY: 0.11,
    dive: 210,
    tilt: -16,
    size: 0.82,
  },
  {
    x: 0.12,
    y: 0.47,
    z: 260,
    phase: 1.8,
    speed: 0.17,
    orbitX: 0.11,
    orbitY: 0.1,
    dive: 250,
    tilt: 10,
    size: 0.78,
  },
];

const STAR_COUNT = 58;
const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  avif: "image/avif",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function createPhotoMotion(index: number): PhotoMotion {
  const motion = PHOTO_MOTIONS[index % PHOTO_MOTIONS.length];
  return motion;
}

function starPosition(index: number, axis: "x" | "y") {
  const step = axis === "x" ? 37.91 : 61.17;
  return `${(index * step + (axis === "x" ? 4 : 11)) % 100}%`;
}

function formatDiaryDate(value: number) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function mergePendingDiary(
  entries: SecretDiaryEntry[],
  items: SharedSyncItem[],
): { entries: SecretDiaryEntry[]; draft: DiaryDraft | null | undefined } {
  const mergedEntries = new Map(entries.map((entry) => [entry.id, entry]));
  let draft: DiaryDraft | null | undefined;
  for (const item of items) {
    if (item.kind === "diary-save") mergedEntries.set(item.entry.id, item.entry);
    if (item.kind === "diary-delete") mergedEntries.delete(item.entryId);
    if (item.kind === "diary-draft") draft = item.draft;
  }
  return {
    entries: [...mergedEntries.values()].sort((left, right) => right.updatedAt - left.updatedAt),
    draft,
  };
}

function shareUrl(token: string): string {
  return `${window.location.origin}${window.location.pathname}${window.location.search}#space=${encodeURIComponent(token)}`;
}

function inviteTokenFromValue(value: string): string {
  const trimmed = value.trim();
  try {
    const parsed = new URL(trimmed);
    const token = new URLSearchParams(parsed.hash.slice(1)).get("space");
    return token ?? trimmed;
  } catch {
    return new URLSearchParams(trimmed.replace(/^#/, "")).get("space") ?? trimmed;
  }
}

export function SecretPhotoExperience({ onClose }: { onClose: () => void }) {
  const [screen, setScreen] = useState<
    "space-access" | "passcode" | "universe" | "diary-gate" | "diary"
  >("space-access");
  const { user } = useCurrentUserState();
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const [spaceConnected, setSpaceConnected] = useState(false);
  const [spaceReady, setSpaceReady] = useState(false);
  const [spaceBusy, setSpaceBusy] = useState(false);
  const [bootstrapKey, setBootstrapKey] = useState("");
  const [inviteInput, setInviteInput] = useState("");
  const [accessError, setAccessError] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [shareError, setShareError] = useState("");
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [failedPhotos, setFailedPhotos] = useState<Set<string>>(() => new Set());
  const [uploadedPhotos, setUploadedPhotos] = useState<SecretCloudPhoto[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "offline" | "error">("idle");
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photoStorageError, setPhotoStorageError] = useState("");
  const [photoStorageStatus, setPhotoStorageStatus] = useState("");
  const [entries, setEntries] = useState<SecretDiaryEntry[]>([]);
  const [diaryBody, setDiaryBody] = useState("");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [diaryLoaded, setDiaryLoaded] = useState(false);
  const [diaryStatus, setDiaryStatus] = useState<
    "loading" | "saved" | "unsaved" | "saving" | "offline" | "error"
  >("loading");
  const [diaryError, setDiaryError] = useState("");
  const [legacyPhotoCount, setLegacyPhotoCount] = useState(0);
  const [legacyEntryCount, setLegacyEntryCount] = useState(0);
  const [importingLegacyData, setImportingLegacyData] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const photoRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const diaryButtonRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const anglesRef = useRef({ yaw: 0, pitch: -0.035, yawVelocity: 0, pitchVelocity: 0 });
  const selectedIndexRef = useRef<number | null>(null);
  const scheduleFrameRef = useRef<(() => void) | null>(null);
  const diaryLoadStartedRef = useRef(false);
  const syncLockedRef = useRef(false);
  const syncRetryTimerRef = useRef<number | null>(null);
  const pendingPhotoUrlsRef = useRef(new Map<string, string>());
  const suppressDiaryClickRef = useRef(false);
  const suppressDiaryClickTimerRef = useRef<number | null>(null);

  const photos: SecretPhoto[] = [
    ...secretUniversePhotos.map((photo, index) => ({
      id: `memory-${index}`,
      src: photo.src,
      alt: photo.alt,
      caption: photo.caption,
      uploaded: false,
    })),
    ...uploadedPhotos.map((photo) => ({
      id: photo.id,
      src: photo.url,
      alt: photo.name,
      caption: photo.name,
      uploaded: true,
    })),
  ];

  useEffect(() => {
    let active = true;
    const pendingPhotoUrls = pendingPhotoUrlsRef.current;
    const inviteToken = new URLSearchParams(window.location.hash.slice(1)).get("space");
    if (inviteToken) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      void connectSharedSpace(inviteToken).then(
        () => {
          if (!active) return;
          setSpaceConnected(true);
          setScreen("passcode");
        },
        (error: unknown) => {
          if (!active) return;
          setAccessError(error instanceof Error ? error.message : "Không thể kết nối liên kết.");
        },
      ).finally(() => {
        if (active) setSpaceReady(true);
      });
    } else {
      void getSharedSpaceConnection().then(
        ({ connected }) => {
          if (!active) return;
          setSpaceConnected(connected);
          if (connected) setScreen("passcode");
        },
        (error: unknown) => {
          if (active) {
            setAccessError(error instanceof Error ? error.message : "Không thể kiểm tra kết nối.");
          }
        },
      ).finally(() => {
        if (active) setSpaceReady(true);
      });
    }

    return () => {
      active = false;
      pendingPhotoUrls.forEach((url) => URL.revokeObjectURL(url));
      pendingPhotoUrls.clear();
      if (syncRetryTimerRef.current !== null) window.clearTimeout(syncRetryTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const scrollY = window.scrollY;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";

    return () => {
      root.style.overflow = previousOverflow;
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    selectedIndexRef.current = selectedPhotoIndex;
  }, [selectedPhotoIndex]);

  const refreshSharedPhotos = useCallback(async () => {
    setPhotosLoading(true);
    let pendingPhotos: SecretCloudPhoto[] = [];
    try {
      const items = await getSharedSyncItems();
      const pendingItems = items.filter((item) => item.kind === "photo-upload");
      const deletedIds = new Set(
        items.flatMap((item) => (item.kind === "photo-delete" ? [item.photoId] : [])),
      );
      pendingPhotoUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      pendingPhotoUrlsRef.current.clear();
      pendingPhotos = pendingItems.map(({ photo }) => {
        const url = URL.createObjectURL(photo.blob);
        pendingPhotoUrlsRef.current.set(photo.id, url);
        return {
          id: photo.id,
          name: photo.name,
          contentType: photo.type,
          url,
          createdAt: photo.createdAt,
        };
      });
      setPendingSyncCount(items.length);
      const cloudPhotos = await listSharedPhotos();
      setUploadedPhotos([
        ...cloudPhotos.filter((photo) => !deletedIds.has(photo.id)),
        ...pendingPhotos.filter((pending) => !cloudPhotos.some((cloud) => cloud.id === pending.id)),
      ]);
      setPhotoStorageError("");
    } catch (error) {
      setUploadedPhotos(pendingPhotos);
      setPhotoStorageError(
        error instanceof Error ? error.message : "Không thể đọc ảnh đã đồng bộ.",
      );
    } finally {
      setPhotosLoading(false);
    }
  }, []);

  const refreshSharedDiary = useCallback(async () => {
    if (!diaryLoadStartedRef.current) setDiaryStatus("loading");
    let items: SharedSyncItem[] = [];
    try {
      items = await getSharedSyncItems();
      setPendingSyncCount(items.length);
      const stored = await getSharedDiary();
      const merged = mergePendingDiary(stored.entries, items);
      setEntries(merged.entries);
      const selectedDraft = merged.draft === undefined ? stored.draft : merged.draft;
      if (selectedDraft) {
        setDiaryBody(selectedDraft.body);
        setEditingEntryId(selectedDraft.entryId);
      } else if (selectedDraft === null && !diaryLoaded) {
        setDiaryBody("");
        setEditingEntryId(null);
      }
      await cacheSharedDiaryEntries(stored.entries);
      await cacheSharedDiaryDraft(
        selectedDraft
          ? {
              id: "current",
              body: selectedDraft.body,
              entryId: selectedDraft.entryId,
              updatedAt: selectedDraft.updatedAt,
            }
          : null,
      );
      setDiaryStatus(items.length > 0 && !navigator.onLine ? "offline" : "saved");
      setDiaryError("");
    } catch (error) {
      const remoteErrorMessage =
        error instanceof Error ? error.message : "Không thể đọc nhật ký đã đồng bộ.";
      try {
        const [cachedEntries, cachedDraft] = await Promise.all([
          getSharedDiaryCache(),
          getSharedDiaryDraftCache(),
        ]);
        const merged = mergePendingDiary(cachedEntries, items);
        setEntries(merged.entries);
        const selectedDraft = merged.draft === undefined ? cachedDraft : merged.draft;
        if (selectedDraft) {
          setDiaryBody(selectedDraft.body);
          setEditingEntryId(selectedDraft.entryId);
        }
        setDiaryStatus(cachedEntries.length > 0 || items.length > 0 ? "offline" : "error");
      } catch (storageError) {
        setDiaryStatus("error");
        setDiaryError(
          `${remoteErrorMessage} ${
            storageError instanceof Error
              ? storageError.message
              : "Không thể đọc bản sao nhật ký trên thiết bị."
          }`,
        );
        return;
      }
      setDiaryError(remoteErrorMessage);
    } finally {
      setDiaryLoaded(true);
      diaryLoadStartedRef.current = true;
    }
  }, [diaryLoaded]);

  const syncQueuedChanges = useCallback(async () => {
    if (!spaceConnected || syncLockedRef.current) return;
    if (!navigator.onLine) {
      setSyncStatus("offline");
      return;
    }
    syncLockedRef.current = true;
    setSyncStatus("syncing");
    try {
      const synced = await syncPendingSharedChanges();
      const remaining = await getSharedSyncItems();
      setPendingSyncCount(remaining.length);
      setSyncStatus(remaining.length ? "error" : "idle");
      if (synced > 0) {
        setPhotoStorageStatus("Đã đồng bộ các thay đổi đang chờ.");
        setPhotoStorageError("");
        if (screen === "universe") await refreshSharedPhotos();
        if (screen === "diary") await refreshSharedDiary();
      }
    } catch (error) {
      setSyncStatus(navigator.onLine ? "error" : "offline");
      if (screen === "diary") {
        setDiaryStatus(navigator.onLine ? "error" : "offline");
        setDiaryError(
          error instanceof Error ? error.message : "Không thể đồng bộ; dữ liệu vẫn còn trên máy.",
        );
      } else {
        setPhotoStorageError(
          error instanceof Error ? error.message : "Không thể đồng bộ; dữ liệu vẫn còn trên máy.",
        );
      }
      try {
        const remaining = await getSharedSyncItems();
        setPendingSyncCount(remaining.length);
        if (remaining.length > 0) {
          const attempts = remaining[0].attempts;
          const delay = Math.min(60_000, 2 ** Math.min(attempts, 6) * 1_000);
          if (syncRetryTimerRef.current !== null) window.clearTimeout(syncRetryTimerRef.current);
          syncRetryTimerRef.current = window.setTimeout(() => {
            void syncQueuedChanges();
          }, delay);
        }
      } catch (storageError) {
        setSyncStatus("error");
        setPhotoStorageError(
          storageError instanceof Error
            ? storageError.message
            : "Không thể đọc hàng đợi đồng bộ cục bộ.",
        );
      }
    } finally {
      syncLockedRef.current = false;
    }
  }, [refreshSharedDiary, refreshSharedPhotos, screen, spaceConnected]);

  useEffect(() => {
    if (!spaceConnected) return;
    if (screen === "universe") void refreshSharedPhotos();
    if (screen === "diary" && !diaryLoadStartedRef.current) void refreshSharedDiary();
    const onResume = () => {
      if (document.visibilityState !== "visible") return;
      if (screen === "universe") void refreshSharedPhotos();
      if (screen === "diary") void refreshSharedDiary();
      void syncQueuedChanges();
    };
    window.addEventListener("online", onResume);
    window.addEventListener("focus", onResume);
    document.addEventListener("visibilitychange", onResume);
    return () => {
      window.removeEventListener("online", onResume);
      window.removeEventListener("focus", onResume);
      document.removeEventListener("visibilitychange", onResume);
    };
  }, [
    refreshSharedDiary,
    refreshSharedPhotos,
    screen,
    spaceConnected,
    syncQueuedChanges,
  ]);

  useEffect(() => {
    if (!spaceConnected) return;
    let active = true;
    void getSharedSyncItems().then(
      (items) => {
        if (!active) return;
        setPendingSyncCount(items.length);
        if (items.length > 0) void syncQueuedChanges();
      },
      (error: unknown) => {
        if (active) {
          setSyncStatus("error");
          setPhotoStorageError(
            error instanceof Error ? error.message : "Không thể đọc hàng đợi đồng bộ cục bộ.",
          );
        }
      },
    );
    return () => {
      active = false;
    };
  }, [spaceConnected, syncQueuedChanges]);

  useEffect(() => {
    if (!spaceConnected) return;
    let active = true;
    void Promise.all([getUploadedPhotos(), getDiaryEntries()]).then(
      ([photosFromDevice, entriesFromDevice]) => {
        if (!active) return;
        setLegacyPhotoCount(photosFromDevice.length);
        setLegacyEntryCount(entriesFromDevice.length);
      },
      (error: unknown) => {
        if (active) {
          setPhotoStorageError(
            error instanceof Error ? error.message : "Không thể kiểm tra dữ liệu cũ trên thiết bị.",
          );
        }
      },
    );
    return () => {
      active = false;
    };
  }, [spaceConnected]);

  useEffect(() => {
    if (!diaryLoaded || diaryStatus !== "unsaved") return;
    const timer = window.setTimeout(() => {
      void (async () => {
        setDiaryStatus("saving");
        const draft: DiaryDraft = {
          id: "current",
          body: diaryBody,
          entryId: editingEntryId,
          updatedAt: Date.now(),
        };
        try {
          await cacheSharedDiaryDraft(draft);
          await queueSharedSyncItem({
            id: `draft-${draft.updatedAt}`,
            kind: "diary-draft",
            queuedAt: draft.updatedAt,
            attempts: 0,
            draft,
          });
          setPendingSyncCount((count) => count + 1);
          if (navigator.onLine) {
            setDiaryStatus("saving");
            void syncQueuedChanges();
          } else {
            setDiaryStatus("offline");
            setDiaryError("Bản nháp đã lưu trên thiết bị, sẽ đồng bộ khi có mạng.");
          }
        } catch (error) {
          setDiaryStatus("error");
          setDiaryError(
            error instanceof Error ? error.message : "Không thể lưu bản nháp trên thiết bị.",
          );
        }
      })();
    }, 600);

    return () => window.clearTimeout(timer);
  }, [diaryBody, diaryLoaded, diaryStatus, editingEntryId, syncQueuedChanges]);

  useEffect(() => {
    if (screen !== "universe" && screen !== "diary") return;

    const scene = sceneRef.current;
    const world = worldRef.current;
    if (!scene || !world) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bounds = { width: scene.clientWidth, height: scene.clientHeight };
    let frameId: number | null = null;
    let startTime: number | null = null;
    let previousTime: number | null = null;

    const scheduleFrame = () => {
      if (frameId === null) frameId = window.requestAnimationFrame(renderFrame);
    };

    const resizeObserver = new ResizeObserver(() => {
      bounds.width = scene.clientWidth;
      bounds.height = scene.clientHeight;
    });
    resizeObserver.observe(scene);

    const renderFrame = (now: number) => {
      frameId = null;
      if (startTime === null) startTime = now;
      const delta = Math.min(now - (previousTime ?? now), 50);
      previousTime = now;
      const elapsed = (now - startTime) / 1000;
      const entranceDuration = reducedMotion ? 0 : 2.65;
      const entrance = entranceDuration === 0 ? 1 : Math.min(1, elapsed / entranceDuration);
      const easedEntrance = 1 - Math.pow(1 - entrance, 3);
      const angles = anglesRef.current;

      if (!dragRef.current) {
        if (!reducedMotion) angles.yaw += delta * 0.000028;
        angles.yaw += angles.yawVelocity * delta;
        angles.pitch += angles.pitchVelocity * delta;
        const friction = Math.exp(-delta / 950);
        angles.yawVelocity *= friction;
        angles.pitchVelocity *= friction;
      }

      angles.pitch = Math.max(-0.42, Math.min(0.42, angles.pitch));
      world.style.transform = `rotateX(${angles.pitch}rad) rotateY(${angles.yaw}rad)`;

      photoRefs.current.forEach((photoNode, index) => {
        if (!photoNode) return;
        const motion = createPhotoMotion(index);
        const phase = elapsed * motion.speed + motion.phase;
        const x =
          (motion.x + Math.sin(phase) * motion.orbitX + Math.cos(phase * 0.53) * 0.035) *
          bounds.width;
        const y =
          (motion.y + Math.cos(phase * 0.76) * motion.orbitY + Math.sin(phase * 0.41) * 0.03) *
          bounds.height;
        const travel = Math.sin(phase * 0.72) * motion.dive;
        const depth = motion.z + travel - (1 - easedEntrance) * 1250;
        const perspectiveScale = Math.min(1.72, 1050 / Math.max(520, 1050 - depth));
        const roll = motion.tilt + Math.sin(phase * 0.6) * 9;
        const yaw = Math.cos(phase * 0.47) * 12;
        const pitch = Math.sin(phase * 0.38) * 8;
        const opacity = Math.min(1, 0.18 + easedEntrance * 0.82);

        photoNode.style.transform =
          `translate3d(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px), ${depth.toFixed(1)}px) ` +
          `rotateX(${pitch.toFixed(1)}deg) rotateY(${yaw.toFixed(1)}deg) rotateZ(${roll.toFixed(1)}deg) ` +
          `scale(${(motion.size * perspectiveScale).toFixed(3)})`;
        photoNode.style.setProperty("--photo-opacity", opacity.toFixed(3));
      });

      if (diaryButtonRef.current) {
        const phase = elapsed * 0.21 + 1.7;
        const depth = 210 + Math.sin(phase * 0.75) * 130 - (1 - easedEntrance) * 1250;
        const scale = Math.min(1.55, 1050 / Math.max(520, 1050 - depth));
        const x = Math.sin(phase * 0.52) * bounds.width * 0.07;
        const y = Math.cos(phase * 0.68) * bounds.height * 0.06;
        diaryButtonRef.current.style.transform =
          `translate3d(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px), ${depth.toFixed(1)}px) ` +
          `rotateX(${(Math.sin(phase) * 11).toFixed(1)}deg) rotateY(${(Math.cos(phase * 0.57) * 14).toFixed(1)}deg) ` +
          `rotateZ(${(Math.sin(phase * 0.41) * 8).toFixed(1)}deg) scale(${scale.toFixed(3)})`;
      }

      const hasMomentum =
        Math.abs(angles.yawVelocity) > 0.000015 || Math.abs(angles.pitchVelocity) > 0.000015;
      if (!reducedMotion || dragRef.current || hasMomentum || entrance < 1) {
        scheduleFrame();
      }
    };

    scheduleFrameRef.current = scheduleFrame;
    scheduleFrame();

    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      scheduleFrameRef.current = null;
      resizeObserver.disconnect();
    };
  }, [screen]);

  function submitPasscode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const correctPasscode =
      screen === "diary-gate" ? DUNG_DIARY_PASSCODE : SECRET_UNIVERSE_PASSCODE;
    if (passcode === correctPasscode) {
      setPasscode("");
      setPasscodeError("");
      setScreen(screen === "diary-gate" ? "diary" : "universe");
      return;
    }
    setPasscodeError("Ngày sinh nhật chưa đúng. Hãy thử lại nhé.");
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    const target = event.target;
    const photoButton =
      target instanceof Element ? target.closest<HTMLButtonElement>("[data-secret-photo]") : null;
    const diaryButton =
      target instanceof Element ? target.closest<HTMLButtonElement>("[data-diary-button]") : null;
    const current = anglesRef.current;

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: performance.now(),
      yaw: current.yaw,
      pitch: current.pitch,
      photoIndex: photoButton ? Number(photoButton.dataset.secretPhoto) : diaryButton ? -2 : null,
      dragging: false,
    };
    current.yawVelocity = 0;
    current.pitchVelocity = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
    scheduleFrameRef.current?.();
  }

  function moveSpace(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    const angles = anglesRef.current;

    if (!drag.dragging && Math.hypot(deltaX, deltaY) > 6) {
      drag.dragging = true;
    }
    if (!drag.dragging) return;

    event.preventDefault();
    const now = performance.now();
    const sampleDuration = Math.max(1, now - drag.lastTime);
    angles.yaw = drag.yaw + deltaX * 0.0054;
    angles.pitch = Math.max(-0.42, Math.min(0.42, drag.pitch + deltaY * 0.0033));
    angles.yawVelocity = ((event.clientX - drag.lastX) * 0.0054) / sampleDuration;
    angles.pitchVelocity = ((event.clientY - drag.lastY) * 0.0033) / sampleDuration;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.lastTime = now;
    scheduleFrameRef.current?.();
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    if (!drag.dragging && drag.photoIndex === -2 && selectedIndexRef.current === null) {
      suppressDiaryClickRef.current = true;
      suppressDiaryClickTimerRef.current = window.setTimeout(() => {
        suppressDiaryClickRef.current = false;
      }, 0);
      setPasscode("");
      setPasscodeError("");
      setScreen("diary-gate");
    } else if (!drag.dragging && drag.photoIndex !== null && selectedIndexRef.current === null) {
      if (drag.photoIndex >= 0) setSelectedPhotoIndex(drag.photoIndex);
    } else if (drag.dragging && drag.photoIndex === -2) {
      suppressDiaryClickRef.current = true;
      suppressDiaryClickTimerRef.current = window.setTimeout(() => {
        suppressDiaryClickRef.current = false;
      }, 0);
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    scheduleFrameRef.current?.();
  }

  function cancelDrag(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  }

  async function submitBootstrap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSpaceBusy(true);
    setAccessError("");
    try {
      const result = await bootstrapSharedSpace(bootstrapKey.trim());
      setSpaceConnected(true);
      setShareLink(shareUrl(result.inviteToken));
      setBootstrapKey("");
      setScreen("passcode");
    } catch (error) {
      setAccessError(error instanceof Error ? error.message : "Không thể khởi tạo không gian.");
    } finally {
      setSpaceBusy(false);
    }
  }

  async function submitConnect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSpaceBusy(true);
    setAccessError("");
    try {
      await connectSharedSpace(inviteTokenFromValue(inviteInput));
      setSpaceConnected(true);
      setInviteInput("");
      setScreen("passcode");
    } catch (error) {
      setAccessError(error instanceof Error ? error.message : "Không thể kết nối không gian.");
    } finally {
      setSpaceBusy(false);
    }
  }

  async function createInviteLink() {
    setShareStatus("");
    setShareError("");
    try {
      const { inviteToken } = await createSharedSpaceInvite();
      const link = shareUrl(inviteToken);
      setShareLink(link);
      try {
        await navigator.clipboard.writeText(link);
        setShareStatus("Đã tạo liên kết mới và sao chép. Liên kết mời cũ đã được thu hồi.");
      } catch {
        setShareStatus("Đã tạo liên kết mới. Hãy sao chép bằng nút bên cạnh.");
      }
    } catch (error) {
      setShareError(error instanceof Error ? error.message : "Không thể tạo liên kết chia sẻ.");
    }
  }

  async function copyInviteLink() {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setShareStatus("Đã sao chép liên kết.");
      setShareError("");
    } catch {
      setShareError("Không thể tự sao chép. Hãy chọn và sao chép liên kết trong ô bên dưới.");
    }
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setPhotoStorageError("");
    setPhotoStorageStatus("");
    const failures: string[] = [];
    const queued: SecretCloudPhoto[] = [];
    const uploaded: SecretCloudPhoto[] = [];

    for (const file of files) {
      const extension = file.name.split(".").at(-1)?.toLowerCase() ?? "";
      const contentType = file.type.toLowerCase() || IMAGE_MIME_BY_EXTENSION[extension] || "";
      if (!Object.values(IMAGE_MIME_BY_EXTENSION).includes(contentType)) {
        failures.push(`${file.name} (định dạng ảnh chưa được hỗ trợ)`);
        continue;
      }

      const blob =
        file.type.toLowerCase() === contentType
          ? file
          : new Blob([file], { type: contentType });
      const photo = {
        id: crypto.randomUUID(),
        name: file.name,
        type: contentType,
        blob,
        createdAt: Date.now(),
      };
      let uploadError: unknown;

      try {
        if (navigator.onLine) {
          try {
            uploaded.push(await uploadSharedPhoto(photo));
            continue;
          } catch (error) {
            uploadError = error;
            // Keep a local retry only when an online upload cannot complete.
          }
        }

        await queueSharedSyncItem({
          id: `photo-${photo.id}`,
          kind: "photo-upload",
          queuedAt: photo.createdAt,
          attempts: 0,
          photo,
        });
        const url = URL.createObjectURL(file);
        pendingPhotoUrlsRef.current.set(photo.id, url);
        queued.push({
          id: photo.id,
          name: file.name,
          contentType,
          url,
          createdAt: photo.createdAt,
        });
      } catch (error) {
        const uploadMessage =
          uploadError instanceof Error ? ` Lỗi tải lên: ${uploadError.message}.` : "";
        failures.push(
          error instanceof Error
            ? `${file.name}: không thể lưu vào hàng đợi để thử lại (${error.message}).${uploadMessage}`
            : `${file.name}: không thể lưu vào hàng đợi trên thiết bị.${uploadMessage}`,
        );
      }
    }

    if (uploaded.length > 0 || queued.length > 0) {
      const added = [...uploaded, ...queued];
      setUploadedPhotos((current) => [
        ...added,
        ...current.filter((photo) => !added.some((addedPhoto) => addedPhoto.id === photo.id)),
      ]);
      setPendingSyncCount((count) => count + queued.length);
      if (queued.length > 0 && navigator.onLine) {
        setPhotoStorageStatus(
          `${uploaded.length} ảnh đã đồng bộ; ${queued.length} ảnh lưu trên thiết bị, đang thử lại…`,
        );
        void syncQueuedChanges();
      } else if (queued.length > 0) {
        setSyncStatus("offline");
        setPhotoStorageStatus(
          `${uploaded.length} ảnh đã đồng bộ; ${queued.length} ảnh lưu trên thiết bị, sẽ đồng bộ khi có mạng.`,
        );
      } else {
        setPhotoStorageStatus(`${uploaded.length} ảnh đã đồng bộ lên không gian chung.`);
      }
    }
    if (failures.length > 0) {
      setPhotoStorageError(`Không thể lưu một số ảnh: ${failures.join("; ")}.`);
    }
  }

  async function removeUploadedPhoto(photo: SecretPhoto) {
    if (!photo.uploaded || !window.confirm(`Xóa ảnh “${photo.caption}” khỏi không gian chung?`)) {
      return;
    }
    try {
      const items = await getSharedSyncItems();
      const pendingUpload = items.find(
        (item) => item.kind === "photo-upload" && item.photo.id === photo.id,
      );
      if (pendingUpload) {
        await removeSharedSyncItem(pendingUpload.id);
        const url = pendingPhotoUrlsRef.current.get(photo.id);
        if (url) URL.revokeObjectURL(url);
        pendingPhotoUrlsRef.current.delete(photo.id);
      } else {
        await queueSharedSyncItem({
          id: `photo-delete-${crypto.randomUUID()}`,
          kind: "photo-delete",
          queuedAt: Date.now(),
          attempts: 0,
          photoId: photo.id,
        });
      }
      setUploadedPhotos((current) => current.filter((item) => item.id !== photo.id));
      setSelectedPhotoIndex(null);
      setPhotoStorageError("");
      setPendingSyncCount((count) => Math.max(0, count + (pendingUpload ? -1 : 1)));
      setPhotoStorageStatus("Đã xóa khỏi giao diện; thay đổi sẽ đồng bộ khi có mạng.");
      if (!pendingUpload && navigator.onLine) void syncQueuedChanges();
    } catch (error) {
      setPhotoStorageError(
        error instanceof Error ? error.message : "Không thể xếp việc xóa ảnh vào hàng đợi.",
      );
    }
  }

  async function saveCurrentDiaryEntry() {
    const trimmedBody = diaryBody.trim();
    if (!diaryLoaded || !trimmedBody) {
      setDiaryError("Hãy viết một chút trước khi lưu nhật ký nhé.");
      return;
    }

    setDiaryError("");
    const existing = entries.find((entry) => entry.id === editingEntryId);
    const now = Date.now();
    const entry: SecretDiaryEntry = {
      id: existing?.id ?? crypto.randomUUID(),
      body: trimmedBody,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    try {
      await queueSharedSyncItem({
        id: `diary-save-${crypto.randomUUID()}`,
        kind: "diary-save",
        queuedAt: now,
        attempts: 0,
        entry,
      });
      await cacheSharedDiaryEntries(
        [entry, ...entries.filter((item) => item.id !== entry.id)].sort(
          (left, right) => right.updatedAt - left.updatedAt,
        ),
      );
      await cacheSharedDiaryDraft(null);
      await queueSharedSyncItem({
        id: `draft-clear-${crypto.randomUUID()}`,
        kind: "diary-draft",
        queuedAt: now + 1,
        attempts: 0,
        draft: null,
      });
      setEntries((current) =>
        [entry, ...current.filter((item) => item.id !== entry.id)].sort(
          (left, right) => right.updatedAt - left.updatedAt,
        ),
      );
      setEditingEntryId(entry.id);
      setDiaryBody(entry.body);
      setDiaryStatus(navigator.onLine ? "saving" : "offline");
      setPendingSyncCount((count) => count + 2);
      if (navigator.onLine) void syncQueuedChanges();
      else setDiaryError("Nhật ký đã lưu trên thiết bị, sẽ đồng bộ khi có mạng.");
    } catch (error) {
      setDiaryStatus("error");
      setDiaryError(
        error instanceof Error ? error.message : "Không thể lưu nhật ký trên thiết bị.",
      );
    }
  }

  function startNewDiaryEntry() {
    setEditingEntryId(null);
    setDiaryBody("");
    setDiaryError("");
    setDiaryStatus("unsaved");
  }

  function openDiaryEntry(entry: SecretDiaryEntry) {
    setEditingEntryId(entry.id);
    setDiaryBody(entry.body);
    setDiaryError("");
    setDiaryStatus("saved");
  }

  async function removeDiaryEntry(entry: SecretDiaryEntry) {
    if (!window.confirm("Xóa mục nhật ký này khỏi không gian chung? Không thể hoàn tác.")) return;
    try {
      await queueSharedSyncItem({
        id: `diary-delete-${crypto.randomUUID()}`,
        kind: "diary-delete",
        queuedAt: Date.now(),
        attempts: 0,
        entryId: entry.id,
      });
      setEntries((current) => current.filter((item) => item.id !== entry.id));
      if (editingEntryId === entry.id) {
        await cacheSharedDiaryDraft(null);
        await queueSharedSyncItem({
          id: `draft-clear-${crypto.randomUUID()}`,
          kind: "diary-draft",
          queuedAt: Date.now(),
          attempts: 0,
          draft: null,
        });
        setEditingEntryId(null);
        setDiaryBody("");
        setDiaryStatus(navigator.onLine ? "saving" : "offline");
      }
      await cacheSharedDiaryEntries(entries.filter((item) => item.id !== entry.id));
      setPendingSyncCount((count) => count + 1);
      if (navigator.onLine) void syncQueuedChanges();
      setDiaryError("");
    } catch (error) {
      setDiaryStatus("error");
      setDiaryError(
        error instanceof Error ? error.message : "Không thể xếp việc xóa nhật ký vào hàng đợi.",
      );
    }
  }

  async function importLegacyData() {
    setImportingLegacyData(true);
    setPhotoStorageError("");
    try {
      const [localPhotos, localEntries, localDraft] = await Promise.all([
        getUploadedPhotos(),
        getDiaryEntries(),
        getDiaryDraft(),
      ]);
      let accountPhotos: SecretCloudPhoto[] = [];
      let accountEntries: SecretDiaryEntry[] = [];
      let accountDraft: SharedSecretDiaryDraft = null;
      if (user && navigator.onLine) {
        const [photosFromAccount, diaryFromAccount] = await Promise.all([
          listSecretPhotos(),
          getSecretDiary(),
        ]);
        accountPhotos = photosFromAccount;
        accountEntries = diaryFromAccount.entries;
        accountDraft = diaryFromAccount.draft;
      }
      const photoFiles = await Promise.all([
        ...localPhotos.map(async (photo) => ({
          id: `legacy-local-${photo.id}`,
          name: photo.name,
          type: photo.type,
          blob: photo.blob,
          createdAt: photo.createdAt,
        })),
        ...accountPhotos.map(async (photo) => {
          const response = await fetch(photo.url);
          if (!response.ok) throw new Error(`Không thể tải ảnh cũ "${photo.name}" để nhập.`);
          return {
            id: `legacy-account-${photo.id}`,
            name: photo.name,
            type: photo.contentType,
            blob: await response.blob(),
            createdAt: photo.createdAt,
          };
        }),
      ]);
      const oldEntries = [
        ...localEntries.map((entry) => ({ ...entry, id: `legacy-local-${entry.id}` })),
        ...accountEntries.map((entry) => ({ ...entry, id: `legacy-account-${entry.id}` })),
      ];
      if (localDraft?.body.trim()) {
        const matchingEntry = oldEntries.find(
          (entry) => entry.id === `legacy-local-${localDraft.entryId}`,
        );
        if (matchingEntry) {
          matchingEntry.body = localDraft.body;
          matchingEntry.updatedAt = localDraft.updatedAt;
        } else {
          oldEntries.push({
            id: `legacy-local-draft-${localDraft.updatedAt}`,
            body: localDraft.body,
            createdAt: localDraft.updatedAt,
            updatedAt: localDraft.updatedAt,
          });
        }
      }
      if (accountDraft?.body.trim()) {
        const matchingEntry = oldEntries.find(
          (entry) => entry.id === `legacy-account-${accountDraft?.entryId}`,
        );
        if (matchingEntry && accountDraft) {
          matchingEntry.body = accountDraft.body;
          matchingEntry.updatedAt = accountDraft.updatedAt;
        } else if (accountDraft) {
          oldEntries.push({
            id: `legacy-account-draft-${accountDraft.updatedAt}`,
            body: accountDraft.body,
            createdAt: accountDraft.updatedAt,
            updatedAt: accountDraft.updatedAt,
          });
        }
      }
      if (photoFiles.length === 0 && oldEntries.length === 0) {
        setPhotoStorageStatus("Không tìm thấy dữ liệu cũ cần nhập trên thiết bị/tài khoản này.");
        return;
      }
      const sourceText = user ? "thiết bị và tài khoản đang đăng nhập" : "thiết bị này";
      if (
        !window.confirm(
          `Nhập ${photoFiles.length} ảnh và ${oldEntries.length} mục nhật ký từ ${sourceText} vào không gian chung? Bản gốc sẽ được giữ nguyên. Bản nháp sẽ thành mục nhật ký để không ghi đè bản nháp chung.`,
        )
      ) {
        return;
      }
      const queuedAt = Date.now();
      await Promise.all([
        ...photoFiles.map((photo) =>
          queueSharedSyncItem({
            id: `photo-${photo.id}`,
            kind: "photo-upload",
            queuedAt,
            attempts: 0,
            photo,
          }),
        ),
        ...oldEntries.map((entry, index) =>
          queueSharedSyncItem({
            id: `diary-${entry.id}`,
            kind: "diary-save",
            queuedAt: queuedAt + index,
            attempts: 0,
            entry,
          }),
        ),
      ]);
      setPendingSyncCount((count) => count + photoFiles.length + oldEntries.length);
      setLegacyPhotoCount(localPhotos.length);
      setLegacyEntryCount(localEntries.length);
      setPhotoStorageStatus("Đã đưa dữ liệu cũ vào hàng đợi; bản gốc vẫn được giữ.");
      if (navigator.onLine) void syncQueuedChanges();
      else setSyncStatus("offline");
    } catch (error) {
      setPhotoStorageError(
        error instanceof Error ? error.message : "Không thể đọc dữ liệu cũ để nhập.",
      );
    } finally {
      setImportingLegacyData(false);
    }
  }

  function refreshAllSharedData() {
    void refreshSharedPhotos();
    void refreshSharedDiary();
    void syncQueuedChanges();
  }

  function openDiaryGate() {
    if (suppressDiaryClickRef.current) {
      suppressDiaryClickRef.current = false;
      return;
    }
    setPasscode("");
    setPasscodeError("");
    setScreen("diary-gate");
  }

  function handlePhotoKeyboardClick(event: MouseEvent<HTMLButtonElement>, index: number) {
    if (event.detail === 0 && selectedIndexRef.current === null) {
      setSelectedPhotoIndex(index);
    }
  }

  function handlePhotoError(src: string) {
    setFailedPhotos((current) => new Set(current).add(src));
  }

  const activePhoto = selectedPhotoIndex === null ? null : (photos[selectedPhotoIndex] ?? null);
  const editingEntry = entries.find((entry) => entry.id === editingEntryId);

  return createPortal(
    <div className="secret-experience">
      {screen === "space-access" ? (
        <section className="secret-gate" aria-labelledby="secret-space-gate-title">
          <div className="secret-gate__stars" aria-hidden="true">
            {Array.from({ length: STAR_COUNT }, (_, index) => (
              <span
                key={index}
                className="secret-gate__star"
                style={{
                  left: starPosition(index, "x"),
                  top: starPosition(index, "y"),
                  animationDelay: `${(index % 9) * -0.47}s`,
                  opacity: `${0.3 + ((index * 7) % 7) / 10}`,
                }}
              />
            ))}
          </div>
          <button
            type="button"
            className="secret-gate__back"
            onClick={onClose}
            aria-label="Quay lại lá thư"
          >
            <ArrowLeft aria-hidden="true" />
            <span>Về lá thư</span>
          </button>
          <div className="secret-gate__card">
            <p className="secret-eyebrow">Không gian chung · không cần tài khoản</p>
            <span className="secret-gate__sigil" aria-hidden="true">
              <Share2 aria-hidden="true" />
            </span>
            <h1 id="secret-space-gate-title">Kết nối thiết bị</h1>
            <p className="secret-gate__copy">
              Ảnh và nhật ký được chia sẻ qua liên kết mời riêng tư. Dán liên kết trên thiết bị đã
              được mời, hoặc khởi tạo không gian lần đầu.
            </p>
            {!spaceReady ? (
              <p className="secret-account-status" role="status">
                Đang kiểm tra kết nối…
              </p>
            ) : (
              <>
                <form className="shared-space-access-form" onSubmit={submitConnect}>
                  <label htmlFor="space-invite">Liên kết mời</label>
                  <input
                    id="space-invite"
                    type="text"
                    autoComplete="url"
                    value={inviteInput}
                    onChange={(event) => setInviteInput(event.target.value)}
                    placeholder="Dán liên kết chia sẻ vào đây"
                    required
                  />
                  <button
                    type="submit"
                    className="secret-gate__submit"
                    disabled={spaceBusy || !inviteInput.trim()}
                  >
                    {spaceBusy ? "Đang kết nối…" : "Kết nối không gian"}
                  </button>
                </form>
                <details className="shared-space-bootstrap">
                  <summary>Khởi tạo không gian trên thiết bị đầu tiên</summary>
                  <form onSubmit={submitBootstrap}>
                    <label htmlFor="space-bootstrap-key">Mã khởi tạo từ người quản lý ứng dụng</label>
                    <input
                      id="space-bootstrap-key"
                      type="password"
                      autoComplete="off"
                      minLength={32}
                      value={bootstrapKey}
                      onChange={(event) => setBootstrapKey(event.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      className="secret-gate__submit"
                      disabled={spaceBusy || bootstrapKey.trim().length < 32}
                    >
                      {spaceBusy ? "Đang khởi tạo…" : "Tạo liên kết đầu tiên"}
                    </button>
                  </form>
                </details>
                {accessError ? (
                  <p className="secret-gate__error" role="alert">
                    {accessError}
                  </p>
                ) : null}
              </>
            )}
            <p className="secret-gate__note">
              Mã sinh nhật chỉ mở giao diện; quyền đồng bộ được cấp riêng bằng liên kết mời.
            </p>
          </div>
          <span className="secret-gate__glow secret-gate__glow--one" aria-hidden="true" />
          <span className="secret-gate__glow secret-gate__glow--two" aria-hidden="true" />
        </section>
      ) : screen === "passcode" || screen === "diary-gate" ? (
        <section
          className="secret-gate"
          aria-labelledby={screen === "diary-gate" ? "diary-gate-title" : "secret-gate-title"}
        >
          <div className="secret-gate__stars" aria-hidden="true">
            {Array.from({ length: STAR_COUNT }, (_, index) => (
              <span
                key={index}
                className="secret-gate__star"
                style={{
                  left: starPosition(index, "x"),
                  top: starPosition(index, "y"),
                  animationDelay: `${(index % 9) * -0.47}s`,
                  opacity: `${0.3 + ((index * 7) % 7) / 10}`,
                }}
              />
            ))}
          </div>
          <button
            type="button"
            className="secret-gate__back"
            onClick={screen === "diary-gate" ? () => setScreen("universe") : onClose}
            aria-label={screen === "diary-gate" ? "Quay lại vũ trụ ảnh" : "Quay lại lá thư"}
          >
            <ArrowLeft aria-hidden="true" />
            <span>{screen === "diary-gate" ? "Về vũ trụ ảnh" : "Về lá thư"}</span>
          </button>

          <div className="secret-gate__card">
            <p className="secret-eyebrow">
              {screen === "diary-gate" ? "Một góc nhỏ của riêng Dũng" : "Một cánh cửa nhỏ đang chờ"}
            </p>
            <span className="secret-gate__sigil" aria-hidden="true">
              {screen === "diary-gate" ? <BookOpenText aria-hidden="true" /> : "✳"}
            </span>
            <h1 id={screen === "diary-gate" ? "diary-gate-title" : "secret-gate-title"}>
              {screen === "diary-gate" ? "Nhật ký của Dũng" : "Một điều bí mật"}
            </h1>
            <p className="secret-gate__copy">
              {screen === "diary-gate"
                ? "Nhập sinh nhật của Dũng"
                : "Nhập sinh nhật của Huệ để mở lối vào những kỷ niệm."}
            </p>
            <form className="secret-gate__form" onSubmit={submitPasscode}>
              <label className="secret-gate__label" htmlFor="secret-passcode">
                {screen === "diary-gate" ? "Nhập sinh nhật của Dũng" : "Nhập sinh nhật của Huệ"}
              </label>
              <input
                id="secret-passcode"
                className="secret-gate__input"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                autoFocus
                maxLength={12}
                value={passcode}
                onChange={(event) => {
                  setPasscode(event.target.value);
                  setPasscodeError("");
                }}
                aria-describedby={passcodeError ? "secret-passcode-error" : undefined}
                placeholder="••••••"
              />
              {passcodeError ? (
                <p
                  id="secret-passcode-error"
                  className="secret-gate__error"
                  role="status"
                  aria-live="polite"
                >
                  {passcodeError}
                </p>
              ) : null}
              <button className="secret-gate__submit" type="submit" disabled={!passcode}>
                {screen === "diary-gate" ? "Mở nhật ký" : "Mở cánh cửa"}
              </button>
            </form>
            <p className="secret-gate__note">
              {screen === "diary-gate"
                ? "Những dòng chữ sẽ được đồng bộ trong không gian chung của các thiết bị đã kết nối."
                : "Chỉ dành cho người biết ngày bắt đầu câu chuyện."}
            </p>
          </div>
          <span className="secret-gate__glow secret-gate__glow--one" aria-hidden="true" />
          <span className="secret-gate__glow secret-gate__glow--two" aria-hidden="true" />
        </section>
      ) : screen === "diary" ? (
        <main className="secret-diary">
          <header className="secret-diary__header">
            <button
              type="button"
              className="secret-diary__back"
              onClick={() => setScreen("universe")}
            >
              <ArrowLeft aria-hidden="true" />
              Về vũ trụ ảnh
            </button>
            <div>
              <p className="secret-eyebrow">Những dòng chữ chỉ mình Dũng giữ</p>
              <h1>Nhật ký của Dũng</h1>
            </div>
            <button
              type="button"
              className="secret-diary__new"
              onClick={startNewDiaryEntry}
              disabled={!diaryLoaded}
            >
              Viết mục mới
            </button>
          </header>

          <div className="secret-diary__layout">
            <section className="secret-diary__editor" aria-label="Soạn nhật ký">
              <div className="secret-diary__editor-top">
                <p>{editingEntryId ? "Đang chỉnh sửa một kỷ niệm" : "Một trang mới"}</p>
                <span
                  className={`secret-diary__status is-${diaryStatus}`}
                  aria-live="polite"
                  role="status"
                >
                  {diaryStatus === "loading"
                    ? "Đang mở nhật ký…"
                    : diaryStatus === "saving"
                      ? "Đang lưu…"
                      : diaryStatus === "unsaved"
                        ? "Đang lưu nháp…"
                        : diaryStatus === "offline"
                          ? "Đã lưu trên thiết bị · chờ mạng"
                        : diaryStatus === "error"
                          ? "Chưa lưu được"
                          : "Đã đồng bộ"}
                </span>
              </div>
              <textarea
                className="secret-diary__textarea"
                value={diaryBody}
                onChange={(event) => {
                  setDiaryBody(event.target.value);
                  setDiaryError("");
                  setDiaryStatus("unsaved");
                }}
                placeholder="Viết xuống những điều muốn nhớ…"
                aria-label="Nội dung nhật ký"
                disabled={!diaryLoaded}
              />
              {diaryError ? (
                <p className="secret-diary__error" role="alert">
                  {diaryError}
                </p>
              ) : null}
              <div className="secret-diary__editor-bottom">
                <p>
                  {editingEntryId
                    ? editingEntry
                      ? `Tạo ${formatDiaryDate(editingEntry.createdAt)} · cập nhật ${formatDiaryDate(editingEntry.updatedAt)}`
                      : "Bản nháp được tự lưu sau khi bạn dừng gõ."
                    : "Bản nháp được tự lưu sau khi bạn dừng gõ."}
                </p>
                <button
                  type="button"
                  className="secret-diary__save"
                  onClick={() => void saveCurrentDiaryEntry()}
                  disabled={!diaryLoaded || diaryStatus === "saving" || !diaryBody.trim()}
                >
                  {editingEntryId ? "Lưu chỉnh sửa" : "Lưu nhật ký"}
                </button>
              </div>
            </section>

            <section className="secret-diary__entries" aria-label="Các mục nhật ký đã lưu">
              <div className="secret-diary__entries-heading">
                <h2>Những trang đã giữ</h2>
                <span>{entries.length.toString().padStart(2, "0")}</span>
              </div>
              {entries.length === 0 ? (
                <p className="secret-diary__empty">
                  Chưa có trang nào được lưu. Những dòng đầu tiên sẽ ở đây.
                </p>
              ) : (
                <ul>
                  {entries.map((entry, index) => (
                    <li key={entry.id} className={entry.id === editingEntryId ? "is-active" : ""}>
                      <button
                        type="button"
                        className="secret-diary__entry"
                        onClick={() => openDiaryEntry(entry)}
                      >
                        <span className="secret-diary__entry-index">
                          {String(entries.length - index).padStart(2, "0")}
                        </span>
                        <span className="secret-diary__entry-content">
                          <span>{entry.body}</span>
                          <small>
                            Tạo {formatDiaryDate(entry.createdAt)}
                            {entry.updatedAt !== entry.createdAt
                              ? ` · cập nhật ${formatDiaryDate(entry.updatedAt)}`
                              : ""}
                          </small>
                        </span>
                      </button>
                      <button
                        type="button"
                        className="secret-diary__delete"
                        aria-label={`Xóa nhật ký ${index + 1}`}
                        onClick={() => void removeDiaryEntry(entry)}
                      >
                        <Trash2 aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
          <p className="secret-diary__privacy">
            Nhật ký được chia sẻ với những thiết bị có liên kết mời. Bản nháp được lưu cục bộ và
            đồng bộ lại khi có mạng.
          </p>
        </main>
      ) : (
        <main className="secret-universe" aria-label="Không gian ảnh bí mật">
          <div className="secret-universe__nebula" aria-hidden="true" />
          <div className="secret-universe__starfield" aria-hidden="true">
            {Array.from({ length: STAR_COUNT }, (_, index) => (
              <span
                key={index}
                className="secret-universe__star"
                style={{
                  left: starPosition(index, "x"),
                  top: starPosition(index, "y"),
                  animationDelay: `${(index % 12) * -0.63}s`,
                  opacity: `${0.25 + ((index * 5) % 8) / 10}`,
                }}
              />
            ))}
            <span className="secret-universe__streak secret-universe__streak--one" />
            <span className="secret-universe__streak secret-universe__streak--two" />
          </div>

          <div className="secret-universe__chrome">
            <button
              type="button"
              className="secret-universe__back"
              onClick={onClose}
              aria-label="Quay lại lá thư"
            >
              <ArrowLeft aria-hidden="true" />
              <span>Về lá thư</span>
            </button>
            <div className="secret-universe__tools">
              <label className="secret-universe__upload">
                <ImagePlus aria-hidden="true" />
                <span>Thêm ảnh</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  aria-label="Chọn một hoặc nhiều ảnh từ thiết bị"
                  onChange={(event) => void handleUpload(event)}
                />
              </label>
              <p className="secret-universe__counter">
                {photos.length.toString().padStart(2, "0")} ký ức
              </p>
              <button
                type="button"
                className="secret-universe__tool-button"
                aria-label="Làm mới ảnh và nhật ký"
                title="Làm mới ảnh và nhật ký"
                onClick={refreshAllSharedData}
              >
                <RefreshCw aria-hidden="true" />
              </button>
              <button
                type="button"
                className="secret-universe__tool-button"
                aria-label="Tạo liên kết chia sẻ mới"
                title="Tạo liên kết chia sẻ mới"
                onClick={() => void createInviteLink()}
              >
                <Share2 aria-hidden="true" />
              </button>
              <UserButton />
            </div>
          </div>
          {shareLink ? (
            <div className="shared-space-link-panel">
              <label htmlFor="shared-space-link">Liên kết mời mới · liên kết cũ đã thu hồi</label>
              <div>
                <input
                  id="shared-space-link"
                  type="url"
                  readOnly
                  value={shareLink}
                  onFocus={(event) => event.currentTarget.select()}
                />
                <button type="button" onClick={() => void copyInviteLink()} aria-label="Sao chép liên kết">
                  <Copy aria-hidden="true" />
                </button>
              </div>
              {shareStatus ? <p role="status">{shareStatus}</p> : null}
              {shareError ? <p role="alert">{shareError}</p> : null}
            </div>
          ) : null}

          <div
            ref={sceneRef}
            className="secret-universe__scene"
            aria-label="Không gian ảnh 3D. Kéo hoặc vuốt để xoay."
            onPointerDown={startDrag}
            onPointerMove={moveSpace}
            onPointerUp={endDrag}
            onPointerCancel={cancelDrag}
          >
            <div
              ref={worldRef}
              className={`secret-universe__world${selectedPhotoIndex !== null ? " has-selection" : ""}`}
            >
              {photos.map((photo, index) => {
                const isFailed = failedPhotos.has(photo.src);
                return (
                  <button
                    key={photo.id}
                    ref={(node) => {
                      photoRefs.current[index] = node;
                    }}
                    type="button"
                    className={`secret-photo${selectedPhotoIndex !== null ? " is-muted" : ""}`}
                    data-secret-photo={index}
                    aria-label={`Mở ảnh: ${photo.caption}`}
                    tabIndex={selectedPhotoIndex === null ? 0 : -1}
                    onClick={(event) => handlePhotoKeyboardClick(event, index)}
                  >
                    {isFailed ? (
                      <span className="secret-photo__missing">Ảnh chưa tải được</span>
                    ) : (
                      <img
                        src={photo.src}
                        alt=""
                        loading="eager"
                        decoding="async"
                        draggable={false}
                        onError={() => handlePhotoError(photo.src)}
                      />
                    )}
                    <span className="secret-photo__caption">{photo.caption}</span>
                  </button>
                );
              })}
              {photos.length === 0 ? (
                <p className="secret-universe__empty">Chưa có ảnh trong không gian này.</p>
              ) : null}
              <button
                ref={diaryButtonRef}
                type="button"
                className="secret-universe__diary-orbit"
                data-diary-button
                aria-label="Nhật ký của Dũng"
                onClick={openDiaryGate}
              >
                <BookOpenText aria-hidden="true" />
                <span>Nhật ký của Dũng</span>
              </button>
            </div>
          </div>

          {photoStorageError || photoStorageStatus ? (
            <p
              className={`secret-universe__storage-message${photoStorageError ? " is-error" : ""}`}
              role={photoStorageError ? "alert" : "status"}
            >
              {photoStorageError || photoStorageStatus}
            </p>
          ) : null}
          {photosLoading ? (
            <p className="secret-universe__storage-message" role="status">
              Đang tải ảnh đã đồng bộ…
            </p>
          ) : null}
          <div className="shared-space-legacy-import">
            <button
              type="button"
              onClick={() => void importLegacyData()}
              disabled={importingLegacyData}
            >
              {importingLegacyData
                ? "Đang kiểm tra dữ liệu cũ…"
                : `Nhập dữ liệu cũ ${legacyPhotoCount + legacyEntryCount > 0 ? `(${legacyPhotoCount} ảnh · ${legacyEntryCount} nhật ký)` : "từ thiết bị/tài khoản"}`}
            </button>
            {pendingSyncCount > 0 ? (
              <span role="status">
                {syncStatus === "syncing"
                  ? `Đang đồng bộ ${pendingSyncCount} thay đổi…`
                  : syncStatus === "offline"
                    ? `${pendingSyncCount} thay đổi chờ có mạng`
                    : `${pendingSyncCount} thay đổi chưa đồng bộ`}
              </span>
            ) : null}
            {syncStatus === "error" ? (
              <button type="button" onClick={() => void syncQueuedChanges()}>
                Thử lại
              </button>
            ) : null}
          </div>

          <div className="secret-universe__hint" aria-hidden="true">
            <Move />
            <span>Kéo để xoay · Chạm ảnh để bước vào khoảnh khắc</span>
          </div>

          <Dialog.Root
            open={activePhoto !== null}
            onOpenChange={(open) => {
              if (!open) setSelectedPhotoIndex(null);
            }}
          >
            <Dialog.Portal>
              <Dialog.Overlay className="secret-photo-viewer__overlay" />
              <Dialog.Content
                className="secret-photo-viewer"
                aria-describedby="secret-photo-caption"
              >
                {activePhoto ? (
                  <>
                    <Dialog.Title className="secret-sr-only">{activePhoto.caption}</Dialog.Title>
                    <div className="secret-photo-viewer__frame">
                      {failedPhotos.has(activePhoto.src) ? (
                        <p className="secret-photo-viewer__missing">Ảnh này chưa tải được.</p>
                      ) : (
                        <img
                          src={activePhoto.src}
                          alt={activePhoto.alt}
                          onError={() => handlePhotoError(activePhoto.src)}
                        />
                      )}
                    </div>
                    <Dialog.Description
                      id="secret-photo-caption"
                      className="secret-photo-viewer__caption"
                    >
                      {activePhoto.caption}
                    </Dialog.Description>
                    <Dialog.Close className="secret-photo-viewer__close" aria-label="Đóng ảnh">
                      <X aria-hidden="true" />
                    </Dialog.Close>
                    {activePhoto.uploaded ? (
                      <button
                        type="button"
                        className="secret-photo-viewer__delete"
                        onClick={() => void removeUploadedPhoto(activePhoto)}
                      >
                        <Trash2 aria-hidden="true" />
                        Xóa ảnh tải lên
                      </button>
                    ) : null}
                  </>
                ) : null}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </main>
      )}
    </div>,
    document.body,
  );
}
