import type { MapLocation, MapEdge } from "../../data/locations";

interface Props {
  locations: MapLocation[];
  edges: MapEdge[];
  width: number;
  height: number;
}

function locationById(locations: MapLocation[], id: string) {
  return locations.find((l) => l.id === id);
}

export function MapPaths({ locations, edges, width, height }: Props) {
  return (
    <svg className="map-paths" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <filter id="path-roughen">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.02"
            numOctaves={3}
            result="turbulence"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="turbulence"
            scale={2}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
      {edges.map((edge) => {
        const from = locationById(locations, edge.from);
        const to = locationById(locations, edge.to);
        if (!from || !to) return null;

        const x1 = (from.x / 100) * width;
        const y1 = (from.y / 100) * height;
        const x2 = (to.x / 100) * width;
        const y2 = (to.y / 100) * height;

        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const offset = len * 0.15;
        const nx = -dy / len;
        const ny = dx / len;
        const cpx = mx + nx * offset;
        const cpy = my + ny * offset;

        return (
          <path
            key={`${edge.from}-${edge.to}`}
            d={`M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`}
            fill="none"
            stroke="#6b4226"
            strokeWidth={2}
            strokeDasharray="8 6"
            strokeLinecap="round"
            opacity={0.5}
            filter="url(#path-roughen)"
          />
        );
      })}
    </svg>
  );
}
