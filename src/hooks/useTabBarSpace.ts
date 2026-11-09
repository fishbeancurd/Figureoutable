import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Height of the floating tab bar pill. */
export const TAB_BAR_HEIGHT = 68;

/** Bottom inset the tab bar sits above: the phone's navigation bar or home indicator, at least 12. */
export function useTabBarBottom() {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, 12);
}

/** Space content must leave free so the floating tab bar never covers it. */
export function useTabBarSpace() {
  return TAB_BAR_HEIGHT + useTabBarBottom();
}

/** True while the on-screen keyboard is open. */
export function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const a = Keyboard.addListener(showEvt, () => setVisible(true));
    const b = Keyboard.addListener(hideEvt, () => setVisible(false));
    return () => {
      a.remove();
      b.remove();
    };
  }, []);
  return visible;
}
