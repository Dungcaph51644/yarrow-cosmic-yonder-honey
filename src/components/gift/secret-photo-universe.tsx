import {
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
import { ArrowLeft, BookOpenText, ImagePlus, Move, Trash2, X } from "lucide-react";
import {
  DUNG_DIARY_PASSCODE,
  SECRET_UNIVERSE_PASSCODE,
  secretUniversePhotos,
} from "@/content/secret-universe";
import {
  deleteDiaryDraft,
  deleteDiaryEntry,
  deleteUploadedPhoto,
  getDiaryDraft,
  getDiaryEntries,
  getUploadedPhotos,
  saveDiaryDraft,
  saveDiaryEntry,
  saveUploadedPhoto,
  type SecretDiaryEntry,
  type StoredSecretPhoto,
} from "@/lib/secret-local-data";
import "./SecretPhotoUniverse.css";

type SecretPhoto = {
  id: string;
  src: string;
  alt: string;
  caption: string;
  uploaded: boolean;
  createdAt?: number;
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

export function SecretPhotoExperience({ onClose }: { onClose: () => void }) {
  const [screen, setScreen] = useState<"passcode" | "universe" | "diary-gate" | "diary">(
    "passcode",
  );
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [failedPhotos, setFailedPhotos] = useState<Set<string>>(() => new Set());
  const [uploadedPhotos, setUploadedPhotos] = useState<StoredSecretPhoto[]>([]);
  const [photoStorageError, setPhotoStorageError] = useState("");
  const [photoStorageStatus, setPhotoStorageStatus] = useState("");
  const [entries, setEntries] = useState<SecretDiaryEntry[]>([]);
  const [diaryBody, setDiaryBody] = useState("");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [diaryLoaded, setDiaryLoaded] = useState(false);
  const [diaryStatus, setDiaryStatus] = useState<
    "loading" | "saved" | "unsaved" | "saving" | "error"
  >("loading");
  const [diaryError, setDiaryError] = useState("");
  const sceneRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const photoRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const diaryButtonRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const anglesRef = useRef({ yaw: 0, pitch: -0.035, yawVelocity: 0, pitchVelocity: 0 });
  const selectedIndexRef = useRef<number | null>(null);
  const scheduleFrameRef = useRef<(() => void) | null>(null);
  const uploadedPhotoUrlsRef = useRef(new Map<string, string>());
  const diaryLoadStartedRef = useRef(false);
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
      src: uploadedPhotoUrlsRef.current.get(photo.id) ?? "",
      alt: photo.name,
      caption: photo.name,
      uploaded: true,
      createdAt: photo.createdAt,
    })),
  ];

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

  useEffect(() => {
    let active = true;
    const uploadedPhotoUrls = uploadedPhotoUrlsRef.current;
    void getUploadedPhotos().then(
      (storedPhotos) => {
        if (!active) return;
        for (const photo of storedPhotos) {
          uploadedPhotoUrls.set(photo.id, URL.createObjectURL(photo.blob));
        }
        setUploadedPhotos(storedPhotos);
      },
      (error: unknown) => {
        if (active) {
          setPhotoStorageError(
            error instanceof Error ? error.message : "Không thể tải ảnh đã lưu trên thiết bị.",
          );
        }
      },
    );

    return () => {
      active = false;
      if (suppressDiaryClickTimerRef.current !== null) {
        window.clearTimeout(suppressDiaryClickTimerRef.current);
      }
      for (const objectUrl of uploadedPhotoUrls.values()) {
        URL.revokeObjectURL(objectUrl);
      }
      uploadedPhotoUrls.clear();
    };
  }, []);

  useEffect(() => {
    if (screen !== "diary" || diaryLoadStartedRef.current) return;
    diaryLoadStartedRef.current = true;
    let active = true;

    void Promise.all([getDiaryEntries(), getDiaryDraft()]).then(
      ([storedEntries, draft]) => {
        if (!active) return;
        setEntries(storedEntries.sort((a, b) => b.updatedAt - a.updatedAt));
        if (draft) {
          setDiaryBody(draft.body);
          setEditingEntryId(draft.entryId);
        }
        setDiaryStatus("saved");
        setDiaryLoaded(true);
      },
      (error: unknown) => {
        if (!active) return;
        setDiaryError(
          error instanceof Error ? error.message : "Không thể đọc nhật ký đã lưu trên thiết bị.",
        );
        setDiaryStatus("error");
        setDiaryLoaded(true);
      },
    );

    return () => {
      active = false;
    };
  }, [screen]);

  useEffect(() => {
    if (!diaryLoaded || diaryStatus !== "unsaved") return;
    const timer = window.setTimeout(() => {
      setDiaryStatus("saving");
      void saveDiaryDraft({
        id: "current",
        body: diaryBody,
        entryId: editingEntryId,
        updatedAt: Date.now(),
      }).then(
        () => {
          setDiaryStatus("saved");
          setDiaryError("");
        },
        (error: unknown) => {
          setDiaryStatus("error");
          setDiaryError(
            error instanceof Error ? error.message : "Không thể tự lưu bản nháp trên thiết bị.",
          );
        },
      );
    }, 600);

    return () => window.clearTimeout(timer);
  }, [diaryBody, diaryLoaded, diaryStatus, editingEntryId]);

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

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setPhotoStorageError("");
    setPhotoStorageStatus("");
    const savedNames: string[] = [];
    const failures: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        failures.push(`${file.name} (không phải ảnh)`);
        continue;
      }

      const id =
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const storedPhoto: StoredSecretPhoto = {
        id,
        name: file.name,
        type: file.type,
        blob: file,
        createdAt: Date.now(),
      };

      let objectUrl: string | null = null;
      try {
        objectUrl = URL.createObjectURL(file);
        await saveUploadedPhoto(storedPhoto);
        uploadedPhotoUrlsRef.current.set(id, objectUrl);
        setUploadedPhotos((current) => [...current, storedPhoto]);
        savedNames.push(file.name);
      } catch (error) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        failures.push(
          error instanceof Error
            ? `${file.name}: ${error.message}`
            : `${file.name}: không thể lưu vào thiết bị`,
        );
      }
    }

    if (savedNames.length > 0) {
      setPhotoStorageStatus(
        savedNames.length === 1
          ? `Đã thêm ${savedNames[0]} vào vũ trụ.`
          : `Đã thêm ${savedNames.length} ảnh vào vũ trụ.`,
      );
    }
    if (failures.length > 0) {
      setPhotoStorageError(`Không thêm được: ${failures.join("; ")}.`);
    }
  }

  async function removeUploadedPhoto(photo: SecretPhoto) {
    if (!photo.uploaded || !window.confirm(`Xóa ảnh “${photo.caption}” khỏi thiết bị này?`)) {
      return;
    }
    try {
      await deleteUploadedPhoto(photo.id);
      const objectUrl = uploadedPhotoUrlsRef.current.get(photo.id);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      uploadedPhotoUrlsRef.current.delete(photo.id);
      setUploadedPhotos((current) => current.filter((item) => item.id !== photo.id));
      setSelectedPhotoIndex(null);
      setPhotoStorageError("");
      setPhotoStorageStatus("Đã xóa ảnh tải lên khỏi thiết bị.");
    } catch (error) {
      setPhotoStorageError(
        error instanceof Error ? error.message : "Không thể xóa ảnh khỏi thiết bị.",
      );
    }
  }

  async function saveCurrentDiaryEntry() {
    const trimmedBody = diaryBody.trim();
    if (!diaryLoaded || !trimmedBody) {
      setDiaryError("Hãy viết một chút trước khi lưu nhật ký nhé.");
      return;
    }

    setDiaryStatus("saving");
    setDiaryError("");
    const now = Date.now();
    const existing = entries.find((entry) => entry.id === editingEntryId);
    const entry: SecretDiaryEntry = {
      id: existing?.id ?? `${now}-${Math.random().toString(36).slice(2)}`,
      body: trimmedBody,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    try {
      await saveDiaryEntry(entry);
      await deleteDiaryDraft();
      setEntries((current) =>
        [entry, ...current.filter((item) => item.id !== entry.id)].sort(
          (a, b) => b.updatedAt - a.updatedAt,
        ),
      );
      setEditingEntryId(entry.id);
      setDiaryBody(entry.body);
      setDiaryStatus("saved");
      setDiaryError("");
    } catch (error) {
      setDiaryStatus("error");
      setDiaryError(
        error instanceof Error ? error.message : "Không thể lưu mục nhật ký trên thiết bị.",
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
    if (!window.confirm("Xóa mục nhật ký này khỏi thiết bị? Không thể hoàn tác.")) return;
    try {
      await deleteDiaryEntry(entry.id);
      setEntries((current) => current.filter((item) => item.id !== entry.id));
      if (editingEntryId === entry.id) {
        await deleteDiaryDraft();
        setEditingEntryId(null);
        setDiaryBody("");
        setDiaryStatus("saved");
      }
      setDiaryError("");
    } catch (error) {
      setDiaryStatus("error");
      setDiaryError(
        error instanceof Error ? error.message : "Không thể xóa mục nhật ký trên thiết bị.",
      );
    }
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
      {screen === "passcode" || screen === "diary-gate" ? (
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
                ? "Những dòng chữ chỉ được lưu trên thiết bị này."
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
                        : diaryStatus === "error"
                          ? "Chưa lưu được"
                          : "Đã lưu trên thiết bị"}
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
            Nhật ký và bản nháp được lưu riêng trong trình duyệt trên thiết bị này, không tự đồng
            bộ.
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
            </div>
          </div>

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
