const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const GITHUB_REPO = 'NightFury-Supreme/PetroDash';
const GITHUB_API_BASE = 'https://api.github.com';

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

exports.checkUpdates = async () => {
    const packageJsonPath = path.join(__dirname, '../../../../package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    const currentVersion = packageJson.version;

    const response = await axios.get(`${GITHUB_API_BASE}/repos/${GITHUB_REPO}/releases/latest`);
    const latestRelease = response.data;
    const latestVersion = latestRelease.tag_name.replace('v', '');

    const isUpdateAvailable = compareVersions(latestVersion, currentVersion) > 0;

    return {
        currentVersion,
        latestVersion,
        isUpdateAvailable,
        releaseNotes: latestRelease.body,
        publishedAt: latestRelease.published_at,
        releaseUrl: latestRelease.html_url
    };
};
