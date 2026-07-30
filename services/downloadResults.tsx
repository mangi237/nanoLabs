
import { Platform } from "react-native";
import { Linking } from "react-native";
import { Alert } from "react-native";
const downloadResult = async (fileUrl: string, fileName: string) => {
  try {
    // For web: open in new tab
    if (Platform.OS === 'web') {
      window.open(fileUrl, '_blank');
      return;
    }
    
    // For mobile: use Linking or FileSystem
    const supported = await Linking.canOpenURL(fileUrl);
    
    if (supported) {
      await Linking.openURL(fileUrl);
    } else {
      Alert.alert('Error', 'Cannot open this file type. Please download manually.');
    }
  } catch (error) {
    console.error('Download error:', error);
    Alert.alert('Error', 'Failed to download file');
  }
};

export default downloadResult;