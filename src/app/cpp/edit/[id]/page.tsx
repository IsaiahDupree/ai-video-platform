'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './edit.module.css';

/**
 * APP-011: CPP List & Management
 *
 * Edit page for a Custom Product Page (placeholder for future implementation)
 */

export default function EditCPPPage() {
  const params = useParams();
  const router = useRouter();
  const cppId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [cppData, setCppData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCPPData();
  }, [cppId]);

  const loadCPPData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/cpp/${cppId}?complete=true`);
      const data = await response.json();

      if (data.success) {
        setCppData(data.data);
      } else {
        setError(data.error || 'Failed to load custom product page');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load custom product page');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading custom product page...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <strong>Error:</strong> {error}
        </div>
        <button onClick={() => router.push('/cpp/list')} className={styles.buttonSecondary}>
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Edit Custom Product Page</h1>
        <button onClick={() => router.push('/cpp/list')} className={styles.buttonSecondary}>
          Back to List
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.info}>
          <h2>{cppData?.page?.attributes?.name || 'Unnamed'}</h2>
          <p><strong>ID:</strong> {cppData?.page?.id}</p>
          <p><strong>State:</strong> {cppData?.page?.attributes?.state}</p>
          <p><strong>Visible:</strong> {cppData?.page?.attributes?.visible ? 'Yes' : 'No'}</p>
          {cppData?.page?.attributes?.url && (
            <p>
              <strong>URL:</strong>{' '}
              <a href={cppData.page.attributes.url} target="_blank" rel="noopener noreferrer">
                {cppData.page.attributes.url}
              </a>
            </p>
          )}
        </div>

        {cppData?.version && (
          <div className={styles.section}>
            <h3>Current Version</h3>
            <p><strong>ID:</strong> {cppData.version.id}</p>
            <p><strong>State:</strong> {cppData.version.attributes?.state}</p>
            {cppData.version.attributes?.deepLink && (
              <p>
                <strong>Deep Link:</strong>{' '}
                <a href={cppData.version.attributes.deepLink} target="_blank" rel="noopener noreferrer">
                  {cppData.version.attributes.deepLink}
                </a>
              </p>
            )}
          </div>
        )}

        {cppData?.localizations && cppData.localizations.length > 0 && (
          <div className={styles.section}>
            <h3>Localizations</h3>
            <div className={styles.localizationList}>
              {cppData.localizations.map((loc: any) => (
                <div key={loc.id} className={styles.localizationCard}>
                  <h4>{loc.attributes?.locale}</h4>
                  <p><strong>State:</strong> {loc.attributes?.state}</p>
                  {loc.attributes?.promotionalText && (
                    <p><strong>Promotional Text:</strong> {loc.attributes.promotionalText}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.placeholder}>
          <p>Full editing functionality will be implemented in a future update.</p>
          <p>For now, you can view the details and delete from the list page.</p>
        </div>
      </div>
    </div>
  );
}
