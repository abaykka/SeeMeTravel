"use client";

import { useEffect, useRef, useState } from "react";

type Feature = {
  properties: { id: string; name: string };
  geometry: unknown;
};

type Props = {
  /** ADM0_A3 ids currently marked as visited. */
  selected: readonly string[];
  /** Omit to render read-only (the share view). */
  onToggle?: (id: string) => void;
  /** When this changes, the camera eases to these coordinates. */
  focus?: { lat: number; lng: number } | null;
  className?: string;
};

/*
 * Nine tints of the one ember accent, indexed by the `tint` property (Natural
 * Earth's MAPCOLOR9). Neighbouring countries always get different values, so
 * adjacent visited countries separate without introducing a second hue. The
 * ramp only spans 50% to 68% lightness, so it still reads as a single colour.
 */
const VISITED_TINTS = [
  "#ed8712",
  "#ee8c1d",
  "#ef9227",
  "#f09732",
  "#f09c3d",
  "#f1a247",
  "#f2a752",
  "#f3ad5d",
  "#f4b267",
];

const COLORS = {
  visitedHover: "#ffd9a3",
  unvisited: "#141c29",
  unvisitedHover: "#1f2a3b",
  // A dark bronze wall so each raised country reads as its own block.
  side: "#5c3a10",
  // The page background, drawn as a seam between neighbouring countries.
  stroke: "#070a12",
  globe: "#0d1420",
  atmosphere: "#3d5a80",
};

/**
 * Camera distance that fits the whole globe in a container of this shape.
 *
 * three-globe uses a 50 degree vertical field of view and a globe of radius 1
 * in altitude units. On a portrait container the horizontal field is the
 * limiting one, so a fixed altitude that frames nicely on a wide desktop crops
 * the sphere badly on a phone. Deriving it from the aspect ratio is what makes
 * the globe mobile-first rather than desktop-tuned.
 */
function fitAltitude(width: number, height: number): number {
  if (!width || !height) return 2.4;
  const vHalf = (50 / 2) * (Math.PI / 180);
  const hHalf = Math.atan(Math.tan(vHalf) * (width / height));
  const limiting = Math.min(vHalf, hHalf);
  const margin = 1.3; // breathing room around the sphere
  return Math.max(1.6, (1 / Math.sin(limiting)) * margin - 1);
}

/**
 * globe.gl is vanilla and touches WebGL and window, so it is loaded lazily on the
 * client and owns its own imperative lifecycle. Nothing here goes through React
 * state on a per-frame basis. See DESIGN_PLAN.md section 3.5.
 */
export default function GlobeView({ selected, onToggle, focus, className }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const featuresRef = useRef<Feature[]>([]);
  const hoverRef = useRef<string | null>(null);

  // Kept in refs so the globe's accessors always read current values without
  // the component having to tear down and rebuild on every selection change.
  const selectedRef = useRef<Set<string>>(new Set(selected));
  const onToggleRef = useRef(onToggle);

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  selectedRef.current = new Set(selected);
  onToggleRef.current = onToggle;

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const [{ default: Globe }, res] = await Promise.all([
          import("globe.gl"),
          fetch("/datasets/countries.geo.json"),
        ]);
        if (!res.ok) throw new Error(`countries ${res.status}`);
        const geo = await res.json();
        if (cancelled || !hostRef.current) return;

        featuresRef.current = geo.features;

        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const host = hostRef.current;

        const world = new Globe(host)
          .backgroundColor("rgba(0,0,0,0)")
          .showAtmosphere(true)
          .atmosphereColor(COLORS.atmosphere)
          .atmosphereAltitude(0.18)
          .polygonsData(geo.features)
          .polygonAltitude((d: any) =>
            selectedRef.current.has(d.properties.id) ? 0.06 : 0.005
          )
          .polygonCapColor((d: any) => {
            const id = d.properties.id;
            const isSel = selectedRef.current.has(id);
            if (hoverRef.current === id) {
              return isSel ? COLORS.visitedHover : COLORS.unvisitedHover;
            }
            return isSel ? VISITED_TINTS[d.properties.tint ?? 4] : COLORS.unvisited;
          })
          .polygonSideColor(() => COLORS.side)
          .polygonStrokeColor(() => COLORS.stroke)
          // Name only. The colour already says whether it is visited, so labelling
          // it again is noise.
          .polygonLabel(
            (d: any) => `<div style="
                background:#0f1522;border:1px solid #212c3e;border-radius:8px;
                padding:6px 10px;color:#e7ecf3;font-size:13px;
                font-family:ui-sans-serif,system-ui,sans-serif;white-space:nowrap;">
                ${d.properties.name}
              </div>`
          )
          .polygonsTransitionDuration(reduced ? 0 : 320);

        // A plain matte sphere instead of a photographic texture: lighter, and it
        // makes the ember countries the only thing competing for attention.
        const mat = world.globeMaterial() as any;
        mat.color.set(COLORS.globe);
        mat.emissive?.set?.("#05070c");
        if ("shininess" in mat) mat.shininess = 4;

        if (onToggleRef.current) {
          world
            .onPolygonClick((d: any) => onToggleRef.current?.(d.properties.id))
            .onPolygonHover((d: any) => {
              hoverRef.current = d?.properties?.id ?? null;
              host.style.cursor = d ? "pointer" : "grab";
              world.polygonCapColor(world.polygonCapColor());
            });
        } else {
          world.onPolygonHover((d: any) => {
            hoverRef.current = d?.properties?.id ?? null;
            world.polygonCapColor(world.polygonCapColor());
          });
        }

        // Once the user drags or zooms, the camera belongs to them and resize
        // must stop reframing it.
        let userTookOver = false;

        const controls = world.controls() as any;
        controls.enableZoom = true;
        controls.minDistance = 180;
        controls.maxDistance = 600;
        // Idle rotation signals the object is live and draggable. It stops the
        // moment the user takes hold of it, and never starts under reduced motion.
        controls.autoRotate = !reduced;
        controls.autoRotateSpeed = 0.35;
        controls.addEventListener("start", () => {
          controls.autoRotate = false;
          userTookOver = true;
        });

        world.pointOfView(
          { lat: 24, lng: 12, altitude: fitAltitude(host.clientWidth, host.clientHeight) },
          0
        );

        // Reframe on resize and orientation change, but never fight the user.
        const resize = () => {
          if (!host) return;
          const w = host.clientWidth;
          const h = host.clientHeight;
          world.width(w).height(h);
          if (!userTookOver) {
            const pov = world.pointOfView();
            world.pointOfView({ ...pov, altitude: fitAltitude(w, h) }, 0);
          }
        };
        resize();

        const ro = new ResizeObserver(resize);
        ro.observe(host);

        globeRef.current = world;
        setStatus("ready");

        cleanup = () => {
          ro.disconnect();
          try {
            world._destructor?.();
          } catch {
            // globe.gl versions differ on teardown; the host node is removed anyway.
          }
          host.replaceChildren();
          globeRef.current = null;
        };
      } catch (err) {
        console.error("globe failed to initialise", err);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
    // Built once. Selection and handlers are read through refs.
  }, []);

  // Re-run the colour and altitude accessors when the selection changes.
  useEffect(() => {
    const world = globeRef.current;
    if (!world) return;
    world.polygonAltitude(world.polygonAltitude());
    world.polygonCapColor(world.polygonCapColor());
  }, [selected]);

  // Ease the camera to a country picked from the list, connecting list to sphere.
  useEffect(() => {
    const world = globeRef.current;
    if (!world || !focus) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    (world.controls() as any).autoRotate = false;
    world.pointOfView({ lat: focus.lat, lng: focus.lng, altitude: 1.9 }, reduced ? 0 : 700);
  }, [focus]);

  return (
    <div className={className}>
      <div ref={hostRef} className="globe-host h-full w-full" aria-hidden="true" />
      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="h-32 w-32 animate-pulse rounded-full bg-surface-hi/60" />
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          <p className="max-w-xs text-sm text-muted">
            The globe could not load. Reload the page, or check that WebGL is enabled in your
            browser.
          </p>
        </div>
      )}
    </div>
  );
}
