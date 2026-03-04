import { useMemo, useState } from 'react';
import type { TilePosition, TileCategory } from '../types';

interface TileTrackProps {
  tiles: TilePosition[];
  proteinLength: number;
  onTileClick?: (tile: TilePosition) => void;
  height?: number;
  compact?: boolean;
}

function getTileColor(category: TileCategory): string {
  switch (category) {
    case 'unique':
      return 'fill-red-600 hover:fill-red-500';
    case 'unique_with_homolog':
      return 'fill-orange-500 hover:fill-orange-400';
    case 'divergent':
      return 'fill-yellow-500 hover:fill-yellow-400';
    case 'similar':
      return 'fill-green-500 hover:fill-green-400';
    case 'sla':
      return 'fill-purple-500 hover:fill-purple-400';
    case 'hla':
      return 'fill-blue-500 hover:fill-blue-400';
    case 'human_ortholog':
      return 'fill-cyan-500 hover:fill-cyan-400';
    default:
      return 'fill-gray-500 hover:fill-gray-400';
  }
}

export default function TileTrack({
  tiles,
  proteinLength,
  onTileClick,
  height = 60,
  compact = false,
}: TileTrackProps) {
  const [hoveredTile, setHoveredTile] = useState<TilePosition | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Calculate tile rows (stack overlapping tiles)
  const tileRows = useMemo(() => {
    const rows: TilePosition[][] = [];
    const sortedTiles = [...tiles].sort((a, b) => a.start - b.start);

    for (const tile of sortedTiles) {
      let placed = false;
      for (const row of rows) {
        const lastTile = row[row.length - 1];
        if (lastTile.end < tile.start) {
          row.push(tile);
          placed = true;
          break;
        }
      }
      if (!placed) {
        rows.push([tile]);
      }
    }

    return rows;
  }, [tiles]);

  // Calculate gaps (uncovered regions)
  const gaps = useMemo(() => {
    if (tiles.length === 0) return [{ start: 0, end: proteinLength }];

    const covered = new Array(proteinLength).fill(false);
    for (const tile of tiles) {
      for (let i = tile.start; i <= tile.end && i < proteinLength; i++) {
        covered[i] = true;
      }
    }

    const gapRegions: { start: number; end: number }[] = [];
    let gapStart: number | null = null;

    for (let i = 0; i < proteinLength; i++) {
      if (!covered[i] && gapStart === null) {
        gapStart = i;
      } else if (covered[i] && gapStart !== null) {
        gapRegions.push({ start: gapStart, end: i - 1 });
        gapStart = null;
      }
    }
    if (gapStart !== null) {
      gapRegions.push({ start: gapStart, end: proteinLength - 1 });
    }

    return gapRegions;
  }, [tiles, proteinLength]);

  const rowHeight = compact ? 16 : Math.min(16, Math.floor((height - 20) / Math.max(tileRows.length, 1)));
  const trackHeight = compact ? height : tileRows.length * rowHeight + 20;

  const handleMouseMove = (e: React.MouseEvent, tile: TilePosition) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left + 10,
      y: e.clientY - rect.top - 10,
    });
    setHoveredTile(tile);
  };

  const getCategoryLabel = (category: TileCategory): string => {
    switch (category) {
      case 'unique':
        return 'Unique (no homolog)';
      case 'unique_with_homolog':
        return 'Unique w/ homolog';
      case 'divergent':
        return 'Divergent (<80%)';
      case 'similar':
        return 'Similar (80-99%)';
      case 'sla':
        return 'SLA (pig MHC)';
      case 'hla':
        return 'HLA (human MHC)';
      case 'human_ortholog':
        return 'Human ortholog';
      default:
        return 'Unknown';
    }
  };

  const getCategoryLabelColor = (category: TileCategory): string => {
    switch (category) {
      case 'unique':
        return 'text-red-300';
      case 'unique_with_homolog':
        return 'text-orange-300';
      case 'divergent':
        return 'text-yellow-300';
      case 'similar':
        return 'text-green-300';
      case 'sla':
        return 'text-purple-300';
      case 'hla':
        return 'text-blue-300';
      case 'human_ortholog':
        return 'text-cyan-300';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div className="relative" style={{ height: trackHeight }}>
      <svg className="w-full" style={{ height: trackHeight }}>
        {/* Background */}
        <rect
          x="0"
          y="0"
          width="100%"
          height={compact ? trackHeight : trackHeight - 20}
          className="fill-gray-100 dark:fill-gray-800"
          rx={compact ? 2 : 4}
        />

        {/* Tile rectangles */}
        {compact ? (
          // Compact mode: all tiles in a single row, no stacking
          tiles.map(tile => {
            const x = (tile.start / proteinLength) * 100;
            const width = ((tile.end - tile.start) / proteinLength) * 100;
            return (
              <rect
                key={tile.id}
                x={`${x}%`}
                y={2}
                width={`${Math.max(width, 0.3)}%`}
                height={height - 4}
                rx="2"
                className={`cursor-pointer ${getTileColor(tile.category)}`}
                onClick={() => onTileClick?.(tile)}
                onMouseMove={e => handleMouseMove(e, tile)}
                onMouseLeave={() => setHoveredTile(null)}
              />
            );
          })
        ) : (
          // Normal mode: stack overlapping tiles
          tileRows.map((row, rowIndex) =>
            row.map(tile => {
              const x = (tile.start / proteinLength) * 100;
              const width = ((tile.end - tile.start) / proteinLength) * 100;
              const y = rowIndex * rowHeight + 2;

              return (
                <rect
                  key={tile.id}
                  x={`${x}%`}
                  y={y}
                  width={`${Math.max(width, 0.3)}%`}
                  height={rowHeight - 2}
                  rx="2"
                  className={`cursor-pointer transition-opacity ${getTileColor(tile.category)} ${
                    hoveredTile && hoveredTile.id !== tile.id ? 'opacity-50' : 'opacity-100'
                  }`}
                  onClick={() => onTileClick?.(tile)}
                  onMouseMove={e => handleMouseMove(e, tile)}
                  onMouseLeave={() => setHoveredTile(null)}
                />
              );
            })
          )
        )}

        {/* Gap indicators and axis - hidden in compact mode */}
        {!compact && (
          <>
            {/* Gap indicators */}
            {gaps.map((gap, i) => {
              const x = (gap.start / proteinLength) * 100;
              const width = ((gap.end - gap.start + 1) / proteinLength) * 100;
              return (
                <rect
                  key={`gap-${i}`}
                  x={`${x}%`}
                  y={trackHeight - 22}
                  width={`${Math.max(width, 0.5)}%`}
                  height="6"
                  className="fill-red-500"
                  rx="1"
                >
                  <title>Gap: {gap.start} - {gap.end} ({gap.end - gap.start + 1} aa uncovered)</title>
                </rect>
              );
            })}

            {/* Axis line */}
            <line
              x1="0"
              y1={trackHeight - 15}
              x2="100%"
              y2={trackHeight - 15}
              className="stroke-gray-300 dark:stroke-gray-600"
              strokeWidth="1"
            />

            {/* Axis ticks */}
            {[0, 0.25, 0.5, 0.75, 1].map(pct => (
              <g key={pct}>
                <line
                  x1={`${pct * 100}%`}
                  y1={trackHeight - 18}
                  x2={`${pct * 100}%`}
                  y2={trackHeight - 12}
                  className="stroke-gray-400 dark:stroke-gray-500"
                  strokeWidth="1"
                />
                <text
                  x={`${pct * 100}%`}
                  y={trackHeight - 2}
                  textAnchor="middle"
                  className="fill-gray-500 dark:fill-gray-400 text-[10px]"
                >
                  {Math.round(pct * proteinLength)}
                </text>
              </g>
            ))}
          </>
        )}
      </svg>

      {/* Tooltip */}
      {hoveredTile && (
        <div
          className="absolute pointer-events-none bg-gray-900 dark:bg-gray-700 text-white px-2 py-1 rounded text-xs shadow-lg z-10 max-w-xs"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: 'translateY(-100%)',
          }}
        >
          <div className="font-medium">{hoveredTile.id}</div>
          <div className="text-gray-300">
            Position: {hoveredTile.start} - {hoveredTile.end}
          </div>
          <div className={getCategoryLabelColor(hoveredTile.category)}>
            {getCategoryLabel(hoveredTile.category)}
          </div>
          {hoveredTile.maxIdentity != null && (
            <div className="text-gray-300">
              Identity: {hoveredTile.maxIdentity.toFixed(1)}%
            </div>
          )}
          {hoveredTile.humanMatchCount && hoveredTile.humanMatchCount > 0 && (
            <div className="text-gray-300">
              {hoveredTile.humanMatchCount} human match{hoveredTile.humanMatchCount > 1 ? 'es' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
