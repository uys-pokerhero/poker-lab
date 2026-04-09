import { useRef, useState, useLayoutEffect } from "react";
import { locations, edges } from "../../data/locations";
import { MapLocationMarker } from "./MapLocation";
import { MapPaths } from "./MapPath";
import { CompassRose } from "./CompassRose";
import { MapDecorations } from "./MapDecorations";

export function TreasureMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 500 });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="map-container" ref={containerRef}>
      <MapPaths
        locations={locations}
        edges={edges}
        width={size.width}
        height={size.height}
      />

      {locations.map((loc) => (
        <MapLocationMarker key={loc.id} location={loc} />
      ))}

      <CompassRose />
      <MapDecorations />
    </div>
  );
}
