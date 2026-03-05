/**
 * Clipboard hook wrapping expo-clipboard for React Native.
 */
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";

export function useClipboard() {
  const copy = async (text: string, label = "Text"): Promise<boolean> => {
    try {
      await Clipboard.setStringAsync(text);
      Toast.show({
        type: "success",
        text1: `${label} copied`,
        visibilityTime: 2000,
      });
      return true;
    } catch {
      Toast.show({
        type: "error",
        text1: "Copy failed",
        text2: "Could not access the clipboard.",
        visibilityTime: 3000,
      });
      return false;
    }
  };

  return { copy };
}
