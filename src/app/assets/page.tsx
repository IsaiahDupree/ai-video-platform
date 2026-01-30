'use client';

import { useState, useEffect } from 'react';
import { trackFeatureDiscovery } from '../../services/retentionTracking';
import type {
  Asset,
  AppInfo,
  AssetType,
  AssetStatus,
  AssetStatistics,
  AssetSearchCriteria,
} from '@/types/assetLibrary';
import {
  ASSET_TYPES,
  ASSET_STATUSES,
  getAssetTypeName,
  getAssetStatusName,
  formatFileSize,
} from '@/types/assetLibrary';
import styles from './assets.module.css';

export default function AssetLibraryPage() {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [statistics, setStatistics] = useState<AssetStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'apps' | 'assets' | 'upload' | 'stats'>('apps');
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<AssetType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<AssetStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt' | 'size'>('updatedAt');
  const [showCreateApp, setShowCreateApp] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppBundleId, setNewAppBundleId] = useState('');
  const [newAppPlatform, setNewAppPlatform] = useState<'ios' | 'macos' | 'tvos' | 'watchos' | 'visionos'>('ios');

  // Track feature discovery
  useEffect(() => {
    trackFeatureDiscovery('asset_library');
  }, []);

  useEffect(() => {
    loadApps();
  }, []);

  useEffect(() => {
    if (selectedApp) {
      loadAssets();
      loadStatistics();
    }
  }, [selectedApp, searchText, filterType, filterStatus, sortBy]);

  const loadApps = async () => {
    try {
      setLoading(true);
      // In a real app, this would call an API endpoint
      // For now, we'll use mock data
      const mockApps: AppInfo[] = [
        {
          id: 'app-1',
          name: 'MyApp iOS',
          bundleId: 'com.example.myapp',
          platform: 'ios',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      setApps(mockApps);
      if (mockApps.length > 0 && !selectedApp) {
        setSelectedApp(mockApps[0].id);
      }
    } catch (error) {
      console.error('Error loading apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssets = async () => {
    if (!selectedApp) return;

    try {
      setLoading(true);
      // In a real app, this would call an API endpoint
      // For now, we'll use mock data
      const mockAssets: Asset[] = [];
      setAssets(mockAssets);
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    if (!selectedApp) return;

    try {
      // In a real app, this would call an API endpoint
      const mockStats: AssetStatistics = {
        totalAssets: 0,
        totalSize: 0,
        byType: {} as any,
        byStatus: {} as any,
        byLocale: {},
        latestAssets: [],
      };
      setStatistics(mockStats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleCreateApp = async () => {
    if (!newAppName || !newAppBundleId) return;

    try {
      // In a real app, this would call an API endpoint
      const newApp: AppInfo = {
        id: `app-${Date.now()}`,
        name: newAppName,
        bundleId: newAppBundleId,
        platform: newAppPlatform,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setApps([...apps, newApp]);
      setSelectedApp(newApp.id);
      setShowCreateApp(false);
      setNewAppName('');
      setNewAppBundleId('');
    } catch (error) {
      console.error('Error creating app:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedApp) return;

    try {
      // In a real app, this would upload files to the server
      console.log('Uploading files:', files);
      alert(`Would upload ${files.length} file(s) for app ${selectedApp}`);
      loadAssets();
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    if (filterType !== 'all' && asset.type !== filterType) return false;
    if (filterStatus !== 'all' && asset.status !== filterStatus) return false;
    if (searchText) {
      const search = searchText.toLowerCase();
      if (!asset.name.toLowerCase().includes(search) &&
          !asset.description?.toLowerCase().includes(search)) {
        return false;
      }
    }
    return true;
  });

  const selectedAppInfo = apps.find((app) => app.id === selectedApp);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Asset Library</h1>
        <p>Manage app screenshots, icons, and other assets with version history</p>
      </header>

      <div className={styles.content}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2>Apps</h2>
            <button
              className={styles.btnPrimary}
              onClick={() => setShowCreateApp(true)}
            >
              + New App
            </button>
          </div>

          <div className={styles.appList}>
            {apps.map((app) => (
              <button
                key={app.id}
                className={`${styles.appItem} ${selectedApp === app.id ? styles.active : ''}`}
                onClick={() => setSelectedApp(app.id)}
              >
                <div className={styles.appIcon}>
                  {app.platform === 'ios' && '📱'}
                  {app.platform === 'macos' && '💻'}
                  {app.platform === 'tvos' && '📺'}
                  {app.platform === 'watchos' && '⌚'}
                  {app.platform === 'visionos' && '🥽'}
                </div>
                <div className={styles.appInfo}>
                  <div className={styles.appName}>{app.name}</div>
                  <div className={styles.appBundleId}>{app.bundleId}</div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.main}>
          {!selectedApp ? (
            <div className={styles.emptyState}>
              <p>Select an app or create a new one to get started</p>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className={styles.tabs}>
                <button
                  className={`${styles.tab} ${activeTab === 'assets' ? styles.active : ''}`}
                  onClick={() => setActiveTab('assets')}
                >
                  Assets ({filteredAssets.length})
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 'upload' ? styles.active : ''}`}
                  onClick={() => setActiveTab('upload')}
                >
                  Upload
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 'stats' ? styles.active : ''}`}
                  onClick={() => setActiveTab('stats')}
                >
                  Statistics
                </button>
              </div>

              {/* Assets Tab */}
              {activeTab === 'assets' && (
                <div className={styles.assetsTab}>
                  <div className={styles.filters}>
                    <input
                      type="text"
                      placeholder="Search assets..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className={styles.searchInput}
                    />

                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as AssetType | 'all')}
                      className={styles.filterSelect}
                    >
                      <option value="all">All Types</option>
                      {ASSET_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {getAssetTypeName(type)}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as AssetStatus | 'all')}
                      className={styles.filterSelect}
                    >
                      <option value="all">All Statuses</option>
                      {ASSET_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {getAssetStatusName(status)}
                        </option>
                      ))}
                    </select>

                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className={styles.filterSelect}
                    >
                      <option value="updatedAt">Last Updated</option>
                      <option value="createdAt">Date Created</option>
                      <option value="name">Name</option>
                      <option value="size">File Size</option>
                    </select>
                  </div>

                  {filteredAssets.length === 0 ? (
                    <div className={styles.emptyState}>
                      <p>No assets found</p>
                      <button
                        className={styles.btnPrimary}
                        onClick={() => setActiveTab('upload')}
                      >
                        Upload Assets
                      </button>
                    </div>
                  ) : (
                    <div className={styles.assetGrid}>
                      {filteredAssets.map((asset) => (
                        <div key={asset.id} className={styles.assetCard}>
                          <div className={styles.assetPreview}>
                            {asset.type === 'screenshot' && '📸'}
                            {asset.type === 'preview' && '🎬'}
                            {asset.type === 'icon' && '🎨'}
                            {asset.type === 'logo' && '🏷️'}
                            {asset.type === 'image' && '🖼️'}
                            {asset.type === 'video' && '📹'}
                            {asset.type === 'other' && '📄'}
                          </div>
                          <div className={styles.assetInfo}>
                            <h3>{asset.name}</h3>
                            <div className={styles.assetMeta}>
                              <span className={styles.badge}>{getAssetTypeName(asset.type)}</span>
                              <span className={`${styles.badge} ${styles[asset.status]}`}>
                                {getAssetStatusName(asset.status)}
                              </span>
                            </div>
                            {asset.description && <p>{asset.description}</p>}
                            <div className={styles.assetDetails}>
                              <span>{formatFileSize(asset.fileSize)}</span>
                              {asset.width && asset.height && (
                                <span>{asset.width} × {asset.height}</span>
                              )}
                              <span>v{asset.version}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Upload Tab */}
              {activeTab === 'upload' && (
                <div className={styles.uploadTab}>
                  <div className={styles.uploadArea}>
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className={styles.fileInput}
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className={styles.uploadLabel}>
                      <div className={styles.uploadIcon}>📤</div>
                      <h3>Upload Assets</h3>
                      <p>Drag and drop files here or click to browse</p>
                      <p className={styles.uploadHint}>
                        Supported: PNG, JPG, WebP, MOV, MP4
                      </p>
                    </label>
                  </div>

                  <div className={styles.uploadOptions}>
                    <h3>Upload Options</h3>
                    <div className={styles.formGroup}>
                      <label>Asset Type</label>
                      <select className={styles.input}>
                        {ASSET_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {getAssetTypeName(type)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Initial Status</label>
                      <select className={styles.input}>
                        {ASSET_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {getAssetStatusName(status)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Statistics Tab */}
              {activeTab === 'stats' && statistics && (
                <div className={styles.statsTab}>
                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                      <h3>Total Assets</h3>
                      <div className={styles.statValue}>{statistics.totalAssets}</div>
                    </div>
                    <div className={styles.statCard}>
                      <h3>Total Size</h3>
                      <div className={styles.statValue}>
                        {formatFileSize(statistics.totalSize)}
                      </div>
                    </div>
                  </div>

                  <div className={styles.statSection}>
                    <h3>By Type</h3>
                    <div className={styles.statList}>
                      {Object.entries(statistics.byType).map(([type, count]) => (
                        <div key={type} className={styles.statItem}>
                          <span>{getAssetTypeName(type as AssetType)}</span>
                          <span className={styles.statCount}>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.statSection}>
                    <h3>By Status</h3>
                    <div className={styles.statList}>
                      {Object.entries(statistics.byStatus).map(([status, count]) => (
                        <div key={status} className={styles.statItem}>
                          <span>{getAssetStatusName(status as AssetStatus)}</span>
                          <span className={styles.statCount}>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Create App Modal */}
      {showCreateApp && (
        <div className={styles.modal} onClick={() => setShowCreateApp(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Create New App</h2>
            <div className={styles.formGroup}>
              <label>App Name</label>
              <input
                type="text"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                className={styles.input}
                placeholder="My Awesome App"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Bundle ID</label>
              <input
                type="text"
                value={newAppBundleId}
                onChange={(e) => setNewAppBundleId(e.target.value)}
                className={styles.input}
                placeholder="com.example.myapp"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Platform</label>
              <select
                value={newAppPlatform}
                onChange={(e) => setNewAppPlatform(e.target.value as any)}
                className={styles.input}
              >
                <option value="ios">iOS</option>
                <option value="macos">macOS</option>
                <option value="tvos">tvOS</option>
                <option value="watchos">watchOS</option>
                <option value="visionos">visionOS</option>
              </select>
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.btnSecondary}
                onClick={() => setShowCreateApp(false)}
              >
                Cancel
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleCreateApp}
                disabled={!newAppName || !newAppBundleId}
              >
                Create App
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
