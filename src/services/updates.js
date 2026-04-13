import { Platform } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import * as LegacyFileSystem from 'expo-file-system/legacy';

const appConfig = require('../../app.json').expo;

const APK_MIME_TYPE = 'application/vnd.android.package-archive';
const INSTALL_INTENT_FLAGS = 1 | 268435456;
const INSTALL_PACKAGE_ACTION = 'android.intent.action.INSTALL_PACKAGE';
const INSTALLER_CANCELLED_RESULT_CODE = 0;

const buildInstallFailureMessage = () => [
  'Android opened the installer, but the update was not applied.',
  'Make sure this APK uses the same package name and signing key as the installed app.',
  'If Android blocks installs from this app, allow "Install unknown apps" for Lesson Planner GH and try again.'
].join(' ');

const parseVersionPart = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const compareSemanticVersions = (leftVersion = '', rightVersion = '') => {
  const leftParts = String(leftVersion).split('.').map(parseVersionPart);
  const rightParts = String(rightVersion).split('.').map(parseVersionPart);
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const left = leftParts[index] ?? 0;
    const right = rightParts[index] ?? 0;

    if (left > right) return 1;
    if (left < right) return -1;
  }

  return 0;
};

export const getCurrentVersionInfo = () => ({
  version: appConfig.version || '0.0.0',
  versionCode: appConfig.android?.versionCode ?? 0,
  updateManifestUrl: appConfig.extra?.updateManifestUrl || ''
});

export const checkForAppUpdate = async () => {
  if (Platform.OS !== 'android') {
    throw new Error('This updater is available on Android only.');
  }

  const currentVersion = getCurrentVersionInfo();

  if (!currentVersion.updateManifestUrl || currentVersion.updateManifestUrl.includes('YOUR_GITHUB')) {
    throw new Error('Set expo.extra.updateManifestUrl in app.json to your GitHub version.json URL first.');
  }

  const response = await fetch(currentVersion.updateManifestUrl, {
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`Could not fetch update info (${response.status}).`);
  }

  const remoteManifest = await response.json();

  if (!remoteManifest?.version || !remoteManifest?.apkUrl) {
    throw new Error('version.json is missing required fields: version and apkUrl.');
  }

  const remoteVersionCode = Number.parseInt(remoteManifest.versionCode, 10);
  const currentVersionCode = Number.parseInt(currentVersion.versionCode, 10);

  let hasUpdate = false;

  if (Number.isFinite(remoteVersionCode) && Number.isFinite(currentVersionCode) && remoteVersionCode > currentVersionCode) {
    hasUpdate = true;
  } else if (compareSemanticVersions(remoteManifest.version, currentVersion.version) > 0) {
    hasUpdate = true;
  }

  return {
    hasUpdate,
    currentVersion,
    remoteManifest
  };
};

export const downloadAndInstallUpdate = async (remoteManifest, onProgress) => {
  if (Platform.OS !== 'android') {
    throw new Error('APK installation is supported on Android only.');
  }

  if (!remoteManifest?.apkUrl) {
    throw new Error('The update manifest does not include an apkUrl.');
  }

  const targetFileName = remoteManifest.fileName || `lesson-planner-${remoteManifest.version || 'update'}.apk`;
  const targetUri = `${LegacyFileSystem.cacheDirectory}${targetFileName}`;

  const fileInfo = await LegacyFileSystem.getInfoAsync(targetUri);
  if (fileInfo.exists) {
    await LegacyFileSystem.deleteAsync(targetUri, { idempotent: true });
  }

  const downloadTask = LegacyFileSystem.createDownloadResumable(
    remoteManifest.apkUrl,
    targetUri,
    {},
    (progressEvent) => {
      if (!onProgress || !progressEvent.totalBytesExpectedToWrite) return;

      const progress = progressEvent.totalBytesWritten / progressEvent.totalBytesExpectedToWrite;
      onProgress(progress);
    }
  );

  const result = await downloadTask.downloadAsync();

  if (!result?.uri) {
    throw new Error('The APK download did not complete.');
  }

  const contentUri = await LegacyFileSystem.getContentUriAsync(result.uri);

  const installResult = await IntentLauncher.startActivityAsync(INSTALL_PACKAGE_ACTION, {
    data: contentUri,
    flags: INSTALL_INTENT_FLAGS,
    type: APK_MIME_TYPE
  });

  if (installResult?.resultCode === INSTALLER_CANCELLED_RESULT_CODE) {
    throw new Error(buildInstallFailureMessage());
  }

  return result.uri;
};
