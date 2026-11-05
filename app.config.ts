import type { ExpoConfig } from 'expo/config';

import documentType from './document-type.json';

const appId = 'com.dsd.min';
const { jsonUti: JSON_DOCUMENT_UTI, mimeType: MIN_DOCUMENT_MIME_TYPE, uti: MIN_DOCUMENT_UTI } = documentType;

const config: ExpoConfig = {
  name: 'min',
  slug: 'min',
  version: '1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'min',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: appId,
    buildNumber: '2',
    supportsTablet: true,
    entitlements: {
      'com.apple.security.application-groups': [`group.${appId}`],
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      CFBundleDocumentTypes: [
        {
          CFBundleTypeName: 'Document min',
          CFBundleTypeRole: 'Viewer',
          LSHandlerRank: 'Owner',
          LSItemContentTypes: [MIN_DOCUMENT_UTI, JSON_DOCUMENT_UTI],
        },
      ],
      UTExportedTypeDeclarations: [
        {
          UTTypeIdentifier: MIN_DOCUMENT_UTI,
          UTTypeDescription: 'Document min',
          UTTypeConformsTo: ['public.json', 'public.data'],
          UTTypeTagSpecification: {
            'public.filename-extension': ['minut', 'minut.json'],
            'public.mime-type': [MIN_DOCUMENT_MIME_TYPE],
          },
        },
      ],
    },
  },
  android: {
    package: appId,
    versionCode: 1,
    predictiveBackGestureEnabled: true,
    adaptiveIcon: {
      backgroundColor: '#F6F4EC',
      foregroundImage: './assets/images/adaptive-icon.png',
      monochromeImage: './assets/images/monochrome-icon.png',
    },
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: false,
        category: ['BROWSABLE', 'DEFAULT'],
        data: [
          { scheme: 'content', mimeType: MIN_DOCUMENT_MIME_TYPE },
          { scheme: 'file', mimeType: MIN_DOCUMENT_MIME_TYPE },
        ],
      },
    ],
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    [
      'expo-router',
      {
        headers: {
          'Cross-Origin-Embedder-Policy': 'credentialless',
          'Cross-Origin-Opener-Policy': 'same-origin',
        },
      },
    ],
    'expo-font',
    ['expo-localization', { supportedLocales: ['ca'] }],
    ['expo-file-system', { enableFileSharing: true, supportsOpeningDocumentsInPlace: false }],
    ['expo-notifications', { color: '#3947F5', enableRemoteNotifications: false }],
    ['expo-sqlite', { enableFTS: true }],
    [
      'expo-widgets',
      {
        enableAndroid: true,
        enablePushNotifications: false,
        groupIdentifier: `group.${appId}`,
        widgets: [
          {
            name: 'MinNextTaskWidget',
            displayName: 'Pròxima tasca',
            description: 'Mostra la pròxima tasca del teu min.',
            ios: {
              supportedFamilies: ['systemSmall', 'systemMedium', 'accessoryRectangular'],
              initialLayout: './src/widgets/MinNextTaskWidget.ios.tsx',
            },
            android: {
              targetCellWidth: 4,
              targetCellHeight: 2,
              initialLayout: './src/widgets/MinNextTaskWidget.android.tsx',
            },
          },
        ],
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#F6F4EC',
        image: './assets/images/logo-transparent.png',
        imageWidth: 220,
        resizeMode: 'contain',
        dark: { backgroundColor: '#191C1C', image: './assets/images/logo-transparent.png' },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
