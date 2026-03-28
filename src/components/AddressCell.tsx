import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { createPortal } from "react-dom";
import type { ICellRendererParams } from "ag-grid-community";
import type { EmptyRoom } from "../hooks/useEmptyRoomData";
import { parseFloor, parseStreetNo, parseUnitNo } from "../utils/parse";
import { Image } from "@carbon/icons-react";
import { FloorImageModal, loadMark, type Mark } from "./FloorImageModal";
import { BottomSheet } from "./BottomSheet";

const isTouchDevice = () =>
  window.matchMedia("(hover: none) and (pointer: coarse)").matches;

function ImgWithSpinner({ src, alt, maxWidth, maxHeight }: { src: string; alt: string; maxWidth: number; maxHeight: number }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  return (
    <div style={{ position: 'relative', minWidth: loaded || error ? undefined : 80, minHeight: loaded || error ? undefined : 80, display: 'flex', alignItems: 'center', justifyContent: 'center', width: maxWidth, height: maxHeight }}>
        {!loaded && !error && <div className="img-spinner" />}
      {!error && (
        <img
          src={src}
          alt={alt}
          style={{ display: loaded ? 'block' : 'none', maxWidth, maxHeight, objectFit: 'contain' }}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
    </div>
  )
}

const MARGIN = 8;

interface TooltipProps {
  anchorX: number;
  anchorY: number;
  imgSrc: string;
  imgKey: string;
  unitId: string;
  mark: Mark | null;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function Tooltip({
  anchorX,
  anchorY,
  imgSrc,
  imgKey,
  unitId,
  mark,
  onMouseEnter,
  onMouseLeave,
}: TooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    position: "fixed",
    left: anchorX + 12,
    top: anchorY + 12,
    visibility: "hidden",
  });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const { offsetWidth: w, offsetHeight: h } = ref.current;
    const left = Math.min(anchorX + 12, window.innerWidth - w - MARGIN);
    const top = Math.min(anchorY + 12, window.innerHeight - h - MARGIN);
    setStyle({
      position: "fixed",
      left: Math.max(MARGIN, left),
      top: Math.max(MARGIN, top),
      visibility: "visible",
    });
  }, [anchorX, anchorY]);

  return createPortal(
    <div
      ref={ref}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        ...style,
        zIndex: 9999,
        background: "#fff",
        border: "1px solid var(--cds-border-subtle)",
        borderRadius: 4,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        padding: 4,
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "var(--cds-text-secondary)",
          padding: "2px 4px 6px",
        }}
      >
        {imgKey}　{unitId}
      </div>
      <div style={{ position: "relative", display: "inline-block" }}>
        <ImgWithSpinner
          src={imgSrc}
          alt={imgKey}
          maxWidth={Math.min(1200, window.innerWidth - MARGIN * 2 - 10)}
          maxHeight={Math.min(800, window.innerHeight - MARGIN * 2 - 40)}
        />
        {mark && (
          <div
            style={{
              position: "absolute",
              left: `${mark.x * 100}%`,
              top: `${mark.y * 100}%`,
              width: `${mark.w * 100}%`,
              height: `${mark.h * 100}%`,
              border: "4px solid #ff0000",
              pointerEvents: "none",
              boxSizing: "border-box",
            }}
          />
        )}
      </div>
    </div>,
    document.body,
  );
}

export function AddressCell({ data, eGridCell }: ICellRendererParams<EmptyRoom>) {
  const [hovering, setHovering] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!eGridCell || !isTouchDevice()) return
    const handler = (e: TouchEvent) => {
      e.stopPropagation()
      setHovering(false)
      setModalOpen(true)
    }
    eGridCell.addEventListener('touchend', handler)
    return () => eGridCell.removeEventListener('touchend', handler)
  }, [eGridCell])

  if (!data) return null;

  const floor = parseFloor(data.房屋地址);
  const streetNo = parseStreetNo(data.房屋地址);
  const imgKey = `${data.棟別}${streetNo}-${floor}F`;
  const imgSrc = `/floor/${imgKey}.jpg`;
  const unitNo = parseUnitNo(data.房屋地址);
  const unitId = `${floor}樓之${unitNo}`;

  const [mark, setMark] = useState(() => loadMark(imgKey, unitId));

  const showHover = (e: React.MouseEvent) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPos({ x: e.clientX, y: e.clientY });
    setHovering(true);
  };

  const hideHover = () => {
    timerRef.current = setTimeout(() => setHovering(false), 100);
  };

  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: "0.25rem",
        width: "100%",
      }}
    >
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {data.房屋地址}
      </span>
      <span
        onMouseEnter={showHover}
        onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
        onMouseLeave={hideHover}
        // onClick={(e) => { if (isTouchDevice()) return; e.stopPropagation(); setHovering(false); setModalOpen(true) }}
        style={{
          flexShrink: 0,
          cursor: "pointer",
          color: mark ? "#ff0000" : "var(--cds-link-primary)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Image size={16} />
      </span>
      {hovering && !modalOpen && (
        <Tooltip
          anchorX={pos.x}
          anchorY={pos.y}
          imgSrc={imgSrc}
          imgKey={imgKey}
          unitId={unitId}
          mark={mark}
          onMouseEnter={() => {
            if (timerRef.current) clearTimeout(timerRef.current);
          }}
          onMouseLeave={hideHover}
        />
      )}
      {modalOpen &&
        (import.meta.env.DEV && !isTouchDevice() ? (
          <FloorImageModal
            imgSrc={imgSrc}
            imgKey={imgKey}
            unitId={unitId}
            onClose={() => {
              setModalOpen(false);
              setMark(loadMark(imgKey, unitId));
            }}
          />
        ) : (
          <BottomSheet
            imgSrc={imgSrc}
            imgKey={imgKey}
            unitId={unitId}
            mark={mark}
            onClose={() => {
              setModalOpen(false);
              setMark(loadMark(imgKey, unitId));
            }}
          />
        ))}
    </span>
  );
}
