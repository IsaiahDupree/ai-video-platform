'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './list.module.css';
import type { AppCustomProductPage } from '@/types/ascCustomProductPages';

/**
 * APP-011: CPP List & Management
 *
 * List and manage Custom Product Pages with filtering, search, edit, and delete
 */

interface CPPListResponse {
  success: boolean;
  data: AppCustomProductPage[];
  meta?: {
    paging?: {
      total?: number;
      limit?: number;
    };
  };
  error?: string;
}

export default function CPPListPage() {
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(false);
  const [cpps, setCpps] = useState<AppCustomProductPage[]>([]);
  const [filteredCpps, setFilteredCpps] = useState<AppCustomProductPage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState<'all' | 'visible' | 'hidden'>('all');
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load CPPs
  useEffect(() => {
    loadCPPs();
  }, [selectedAppId]);

  // Filter CPPs when search query or filter changes
  useEffect(() => {
    let filtered = cpps;

    // Apply visibility filter
    if (filterVisible !== 'all') {
      const isVisible = filterVisible === 'visible';
      filtered = filtered.filter(cpp => cpp.attributes?.visible === isVisible);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(cpp => {
        const name = cpp.attributes?.name?.toLowerCase() || '';
        const url = cpp.attributes?.url?.toLowerCase() || '';
        const state = cpp.attributes?.state?.toLowerCase() || '';
        return name.includes(query) || url.includes(query) || state.includes(query);
      });
    }

    setFilteredCpps(filtered);
  }, [cpps, searchQuery, filterVisible]);

  const loadCPPs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedAppId) {
        params.set('appId', selectedAppId);
      }

      const response = await fetch(`/api/cpp/list?${params}`);
      const data: CPPListResponse = await response.json();

      if (data.success) {
        setCpps(data.data);
      } else {
        setError(data.error || 'Failed to load custom product pages');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load custom product pages');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cppId: string, cppName: string) => {
    if (!confirm(`Are you sure you want to delete "${cppName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(cppId);
      setError(null);

      const response = await fetch(`/api/cpp/${cppId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Custom product page deleted successfully');
        // Remove from list
        setCpps(prev => prev.filter(cpp => cpp.id !== cppId));
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to delete custom product page');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete custom product page');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (cppId: string) => {
    router.push(`/cpp/edit/${cppId}`);
  };

  const handleToggleVisibility = async (cpp: AppCustomProductPage) => {
    try {
      setError(null);
      const newVisible = !cpp.attributes?.visible;

      const response = await fetch(`/api/cpp/${cpp.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visible: newVisible,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Custom product page is now ${newVisible ? 'visible' : 'hidden'}`);
        // Update in list
        setCpps(prev => prev.map(c => c.id === cpp.id ? data.data : c));
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to update visibility');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update visibility');
    }
  };

  const getStateBadgeClass = (state?: string) => {
    switch (state) {
      case 'READY_FOR_DISTRIBUTION':
        return styles.badgeSuccess;
      case 'PREPARE_FOR_SUBMISSION':
        return styles.badgeWarning;
      case 'PROCESSING_FOR_DISTRIBUTION':
        return styles.badgeInfo;
      case 'REPLACED_WITH_NEW_VERSION':
        return styles.badgeSecondary;
      default:
        return styles.badgeDefault;
    }
  };

  const formatState = (state?: string) => {
    if (!state) return 'Unknown';
    return state.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Custom Product Pages</h1>
          <p className={styles.subtitle}>
            Manage your Custom Product Pages
          </p>
        </div>
        <button
          onClick={() => router.push('/cpp')}
          className={styles.buttonPrimary}
        >
          Create New CPP
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search by name, URL, or state..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>Visibility:</label>
          <select
            value={filterVisible}
            onChange={(e) => setFilterVisible(e.target.value as any)}
            className={styles.filterSelect}
          >
            <option value="all">All</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>

        <button
          onClick={loadCPPs}
          disabled={loading}
          className={styles.buttonSecondary}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}
      {success && (
        <div className={styles.success}>
          <strong>Success:</strong> {success}
        </div>
      )}

      {/* CPP List */}
      <div className={styles.content}>
        {loading && cpps.length === 0 ? (
          <div className={styles.loading}>Loading custom product pages...</div>
        ) : filteredCpps.length === 0 ? (
          <div className={styles.emptyState}>
            {searchQuery || filterVisible !== 'all' ? (
              <p>No custom product pages match your filters.</p>
            ) : (
              <div>
                <p>No custom product pages found.</p>
                <button
                  onClick={() => router.push('/cpp')}
                  className={styles.buttonPrimary}
                >
                  Create First Custom Product Page
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>State</th>
                  <th>Visibility</th>
                  <th>URL</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCpps.map((cpp) => (
                  <tr key={cpp.id}>
                    <td>
                      <strong>{cpp.attributes?.name || 'Unnamed'}</strong>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${getStateBadgeClass(cpp.attributes?.state)}`}>
                        {formatState(cpp.attributes?.state)}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleVisibility(cpp)}
                        className={`${styles.badgeButton} ${
                          cpp.attributes?.visible ? styles.badgeVisible : styles.badgeHidden
                        }`}
                        title="Click to toggle visibility"
                      >
                        {cpp.attributes?.visible ? 'Visible' : 'Hidden'}
                      </button>
                    </td>
                    <td>
                      {cpp.attributes?.url ? (
                        <a
                          href={cpp.attributes.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.link}
                        >
                          {cpp.attributes.url.length > 40
                            ? cpp.attributes.url.substring(0, 40) + '...'
                            : cpp.attributes.url}
                        </a>
                      ) : (
                        <span className={styles.muted}>—</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          onClick={() => handleEdit(cpp.id)}
                          className={styles.buttonEdit}
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cpp.id, cpp.attributes?.name || 'this page')}
                          disabled={deletingId === cpp.id}
                          className={styles.buttonDelete}
                          title="Delete"
                        >
                          {deletingId === cpp.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Info */}
      {filteredCpps.length > 0 && (
        <div className={styles.footer}>
          Showing {filteredCpps.length} of {cpps.length} custom product page{cpps.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
