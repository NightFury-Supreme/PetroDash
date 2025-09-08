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
const fssync = require('fs');

// Rate limiting for updates endpoint
const updatesRateLimiter = createRateLimiter(100, 15 * 60 * 1000); // 100 requests per 15 minutes
router.use(updatesRateLimiter);

// GitHub repository configuration
const GITHUB_REPO = 'NightFury-Supreme/PetroDash';
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

    // Find full package asset
    const fullAsset = latestRelease.assets.find(asset => 
      asset.name.includes('full-') && asset.name.endsWith('.tar.gz')
    );

    if (!fullAsset) {
      return res.status(404).json({
        error: 'Full package not found in latest release',
        message: 'The latest release does not contain a full package'
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
      releaseUrl: latestRelease.html_url,
      // full package info only
      fullDownloadUrl: fullAsset.browser_download_url,
      fullPackageSize: fullAsset.size,
      fullPackageName: fullAsset.name
    });

  } catch (error) {
    console.error('Error checking for updates:', error);
    res.status(500).json({
      error: 'Failed to check for updates',
      message: error.response?.data?.message || error.message || 'Unknown error occurred'
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

// Update logic removed

module.exports = router;
