import type { ExpoConfig } from 'expo/config';

const appId = 'com.dsd.min';
const documentType = 'com.dsd.min.document';

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
    buildNumber: '1',
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
          LSItemContentTypes: [documentType],
        },
      ],
      UTExportedTypeDeclarations: [
        {
          UTTypeIdentifier: documentType,
          UTTypeDescription: 'Document min',
          UTTypeConformsTo: ['public.json', 'public.data'],
          UTTypeTagSpecification: {
            'public.filename-extension': ['minut', 'minut.json'],
            'public.mime-type': ['application/vnd.min.document+json'],
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
          { scheme: 'content', mimeType: 'application/vnd.min.document+json' },
          { scheme: 'file', mimeType: 'application/vnd.min.document+json' },
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
    ['expo-file-system', { enableFileSharing: true, supportsOpeningDocumentsInPlace: true }],
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
