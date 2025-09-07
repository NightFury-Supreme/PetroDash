const express = require('express');
const axios = require('axios');
const { requireAdmin } = require('../../middleware/auth');
const { createRateLimiter } = require('../../middleware/rateLimit');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();
const execAsync = promisify(exec);

// Rate limiting for updates endpoint
const updatesRateLimiter = createRateLimiter(10, 15 * 60 * 1000); // 10 requests per 15 minutes
router.use(updatesRateLimiter);

// GitHub repository configuration
const GITHUB_REPO = 'your-username/your-repo-name'; // Update this to your actual repository
const GITHUB_API_BASE = 'https://api.github.com';

// GET /api/admin/updates/check - Check for available updates
router.get('/check', requireAdmin, async (req, res) => {
  try {
    // Get current version from package.json
    const packageJsonPath = path.join(__dirname, '../../../package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    const currentVersion = packageJson.version;

    // Fetch latest release from GitHub
    const response = await axios.get(`${GITHUB_API_BASE}/repos/${GITHUB_REPO}/releases/latest`);
    const latestRelease = response.data;
    const latestVersion = latestRelease.tag_name.replace('v', '');

    // Find backend package asset
    const backendAsset = latestRelease.assets.find(asset => 
      asset.name.includes('backend-') && asset.name.endsWith('.tar.gz')
    );

    if (!backendAsset) {
      return res.status(404).json({
        error: 'Backend package not found in latest release',
        message: 'The latest release does not contain a backend package'
      });
    }

    // Compare versions
    const isUpdateAvailable = compareVersions(latestVersion, currentVersion) > 0;

    res.json({
      currentVersion,
      latestVersion,
      isUpdateAvailable,
      releaseNotes: latestRelease.body,
      publishedAt: latestRelease.published_at,
      downloadUrl: backendAsset.browser_download_url,
      releaseUrl: latestRelease.html_url,
      packageSize: backendAsset.size,
      packageName: backendAsset.name
    });

  } catch (error) {
    console.error('Error checking for updates:', error);
    res.status(500).json({
      error: 'Failed to check for updates',
      message: error.response?.data?.message || error.message || 'Unknown error occurred'
    });
  }
});

// POST /api/admin/updates/apply - Apply available update
router.post('/apply', requireAdmin, async (req, res) => {
  try {
    // Check if an update is already in progress
    const statusFile = path.join(__dirname, '../../../update-status.json');
    try {
      const existingStatus = JSON.parse(await fs.readFile(statusFile, 'utf8'));
      if (['starting', 'backing_up', 'downloading', 'extracting', 'applying', 'installing_deps', 'building'].includes(existingStatus.status)) {
        return res.status(409).json({
          error: 'Update in progress',
          message: 'An update is already in progress. Please wait for it to complete.'
        });
      }
    } catch (error) {
      // Status file doesn't exist or is invalid, continue
    }

    // Check if update is available first
    const checkResponse = await axios.get(`${GITHUB_API_BASE}/repos/${GITHUB_REPO}/releases/latest`);
    const latestRelease = checkResponse.data;
    const latestVersion = latestRelease.tag_name.replace('v', '');

    // Get current version
    const packageJsonPath = path.join(__dirname, '../../../package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    const currentVersion = packageJson.version;

    if (compareVersions(latestVersion, currentVersion) <= 0) {
      return res.status(400).json({
        error: 'No update available',
        message: 'You are already running the latest version'
      });
    }

    // Start update process
    res.json({
      message: 'Update process started',
      currentVersion,
      targetVersion: latestVersion,
      status: 'updating'
    });

    // Perform update in background
    performUpdate(latestRelease).catch(error => {
      console.error('Update failed:', error);
    });

  } catch (error) {
    console.error('Error applying update:', error);
    res.status(500).json({
      error: 'Failed to apply update',
      message: error.response?.data?.message || error.message || 'Unknown error occurred'
    });
  }
});

// GET /api/admin/updates/status - Get update status
router.get('/status', requireAdmin, async (req, res) => {
  try {
    const statusFile = path.join(__dirname, '../../../update-status.json');
    
    try {
      const status = JSON.parse(await fs.readFile(statusFile, 'utf8'));
      res.json(status);
    } catch (error) {
      // No status file exists
      res.json({
        status: 'idle',
        message: 'No update in progress'
      });
    }

  } catch (error) {
    console.error('Error getting update status:', error);
    res.status(500).json({
      error: 'Failed to get update status',
      message: error.message
    });
  }
});

// Helper function to compare version strings
function compareVersions(version1, version2) {
  const v1parts = version1.split('.').map(Number);
  const v2parts = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0;
    const v2part = v2parts[i] || 0;
    
    if (v1part > v2part) return 1;
    if (v1part < v2part) return -1;
  }
  
  return 0;
}

// Helper function to perform the actual update
async function performUpdate(release) {
  const statusFile = path.join(__dirname, '../../../update-status.json');
  const projectRoot = path.join(__dirname, '../../../');
  
  try {
    // Check if we're in a development environment
    if (process.env.NODE_ENV === 'development') {
      await fs.writeFile(statusFile, JSON.stringify({
        status: 'failed',
        message: 'Updates are not supported in development environment',
        progress: 0,
        timestamp: new Date().toISOString(),
        error: 'Development environment detected'
      }));
      return;
    }
    // Update status: starting
    await fs.writeFile(statusFile, JSON.stringify({
      status: 'starting',
      message: 'Preparing update...',
      progress: 0,
      timestamp: new Date().toISOString()
    }));

    // Create backup
    await fs.writeFile(statusFile, JSON.stringify({
      status: 'backing_up',
      message: 'Creating backup...',
      progress: 10,
      timestamp: new Date().toISOString()
    }));

    const backupDir = path.join(projectRoot, `backup-${Date.now()}`);
    await execAsync(`cp -r . ${backupDir}`, { cwd: projectRoot });

    // Find backend package asset
    const backendAsset = release.assets.find(asset => 
      asset.name.includes('backend-') && asset.name.endsWith('.tar.gz')
    );

    if (!backendAsset) {
      throw new Error('Backend package not found in release');
    }

    // Download backend package
    await fs.writeFile(statusFile, JSON.stringify({
      status: 'downloading',
      message: 'Downloading backend package...',
      progress: 30,
      timestamp: new Date().toISOString()
    }));

    const updatePackage = path.join(projectRoot, 'backend-update.tar.gz');
    await execAsync(`curl -L -o ${updatePackage} ${backendAsset.browser_download_url}`);

    // Extract backend package
    await fs.writeFile(statusFile, JSON.stringify({
      status: 'extracting',
      message: 'Extracting backend package...',
      progress: 50,
      timestamp: new Date().toISOString()
    }));

    const tempDir = path.join(projectRoot, 'temp-backend-update');
    await fs.mkdir(tempDir, { recursive: true });
    await execAsync(`tar -xzf ${updatePackage} -C ${tempDir}`);

    // Apply backend update
    await fs.writeFile(statusFile, JSON.stringify({
      status: 'applying',
      message: 'Applying backend update...',
      progress: 70,
      timestamp: new Date().toISOString()
    }));

    // Backup current backend
    const backendBackupDir = path.join(projectRoot, `backend-backup-${Date.now()}`);
    await execAsync(`cp -r backend ${backendBackupDir}`);

    // Replace backend files (excluding node_modules and .env)
    await execAsync(`rsync -av --exclude='node_modules' --exclude='.env' --exclude='*.log' ${tempDir}/ backend/`);

    // Install backend dependencies
    await fs.writeFile(statusFile, JSON.stringify({
      status: 'installing_deps',
      message: 'Installing backend dependencies...',
      progress: 85,
      timestamp: new Date().toISOString()
    }));

    await execAsync('npm ci --production', { cwd: path.join(projectRoot, 'backend') });

    // Cleanup
    await execAsync(`rm -rf ${tempDir} ${updatePackage}`);

    // Update complete
    await fs.writeFile(statusFile, JSON.stringify({
      status: 'completed',
      message: 'Update completed successfully! Please restart the application.',
      progress: 100,
      timestamp: new Date().toISOString(),
      newVersion: release.tag_name.replace('v', '')
    }));

  } catch (error) {
    console.error('Update process failed:', error);
    
    // Update failed
    await fs.writeFile(statusFile, JSON.stringify({
      status: 'failed',
      message: `Update failed: ${error.message}`,
      progress: 0,
      timestamp: new Date().toISOString(),
      error: error.message
    }));
  }
}

module.exports = router;
