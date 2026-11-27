import { Alert, type AlertButton, Platform } from 'react-native';

/** react-native-web ships an empty Alert.alert; use the browser dialogs so confirmations work. */
export function installWebAlert(): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  Alert.alert = (title: string, message?: string, buttons?: AlertButton[]) => {
    const text = [title, message].filter(Boolean).join('\n\n');
    const actions = (buttons ?? []).filter((button) => button.style !== 'cancel');
    const cancel = (buttons ?? []).find((button) => button.style === 'cancel');
    if (!buttons || buttons.length < 2) {
      window.alert(text);
      buttons?.[0]?.onPress?.();
      return;
    }
    for (const action of actions) {
      const question = actions.length > 1 ? `${text}\n\n${action.text ?? ''}?` : text;
      if (window.confirm(question)) {
        action.onPress?.();
        return;
      }
    }
    cancel?.onPress?.();
  };
}
