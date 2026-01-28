import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        AI Video Platform
      </h1>
      <p style={{ fontSize: '1.25rem', color: '#666', marginBottom: '2rem' }}>
        AI-powered video generation with static ad studio
      </p>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <Link
          href="/ads/editor"
          style={{
            padding: '2rem',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            background: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Static Ad Studio
          </h2>
          <p style={{ color: '#666' }}>
            Create and customize professional ads with live preview
          </p>
        </Link>

        <div
          style={{
            padding: '2rem',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            background: 'white',
            opacity: 0.6,
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Video Generator
          </h2>
          <p style={{ color: '#666' }}>
            Coming soon - AI-powered video generation
          </p>
        </div>

        <div
          style={{
            padding: '2rem',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            background: 'white',
            opacity: 0.6,
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Apple Pages
          </h2>
          <p style={{ color: '#666' }}>
            Coming soon - App Store product page builder
          </p>
        </div>
      </div>
    </main>
  );
}
