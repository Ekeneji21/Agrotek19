interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ width = '100%', height = '14px', className = '', style }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: 6, ...style }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <Skeleton height="12px" width="40%" style={{ marginBottom: 16 }} />
      <Skeleton height="28px" width="60%" style={{ marginBottom: 8 }} />
      <Skeleton height="12px" width="80%" />
    </div>
  );
}

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card" style={{ padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Skeleton width="40px" height="40px" style={{ borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <Skeleton height="13px" width="50%" style={{ marginBottom: 8 }} />
            <Skeleton height="11px" width="70%" />
          </div>
        </div>
      ))}
    </div>
  );
}
