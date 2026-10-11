export default function DashboardLoading() {
  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Header skeleton */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div
          className="skeleton"
          style={{ width: '240px', height: '28px', borderRadius: 'var(--radius-md)', marginBottom: '8px' }}
        />
        <div
          className="skeleton"
          style={{ width: '360px', height: '18px', borderRadius: 'var(--radius-md)' }}
        />
      </div>

      {/* KPI 4-Card skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div className="skeleton" style={{ width: '90px', height: '14px', borderRadius: 'var(--radius-sm)' }} />
              <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)' }} />
            </div>
            <div className="skeleton" style={{ width: '130px', height: '30px', borderRadius: 'var(--radius-md)', marginBottom: '8px' }} />
            <div className="skeleton" style={{ width: '160px', height: '12px', borderRadius: 'var(--radius-sm)' }} />
          </div>
        ))}
      </div>

      {/* Big Chart Skeleton */}
      <div
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
          height: '320px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div className="skeleton" style={{ width: '200px', height: '20px', borderRadius: 'var(--radius-md)' }} />
        <div className="skeleton" style={{ width: '100%', height: '220px', borderRadius: 'var(--radius-lg)' }} />
      </div>
    </div>
  );
}
