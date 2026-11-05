import { requireOptionalNativeModule } from 'expo';

let available: boolean | null = null;

export function nativeWidgetsAvailable(): boolean {
  available ??= requireOptionalNativeModule('ExpoWidgets') !== null;
  return available;
}
