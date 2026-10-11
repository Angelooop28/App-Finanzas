export default function AdminLoading() {
  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Header skeleton */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div
          className="skeleton"
          style={{ width: '280px', height: '32px', borderRadius: 'var(--radius-md)', marginBottom: '8px' }}
        />
        <div
          className="skeleton"
          style={{ width: '380px', height: '18px', borderRadius: 'var(--radius-md)' }}
        />
      </div>

      {/* 5-Card skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-8)',
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-lg)' }} />
              <div className="skeleton" style={{ width: '80px', height: '12px', borderRadius: 'var(--radius-sm)' }} />
            </div>
            <div className="skeleton" style={{ width: '70px', height: '28px', borderRadius: 'var(--radius-md)' }} />
          </div>
        ))}
      </div>

      {/* Content Table Skeleton */}
      <div
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-sm)',
          height: '240px',
        }}
      >
        <div className="skeleton" style={{ width: '180px', height: '20px', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }} />
        <div className="skeleton" style={{ width: '100%', height: '140px', borderRadius: 'var(--radius-lg)' }} />
      </div>
    </div>
  );
}
