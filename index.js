import 'react-native-gesture-handler';

/**
 * @format
 */

import { AppRegistry } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (
    type === EventType.PRESS &&
    detail.notification?.data?.destination === 'adventure'
  ) {
    await AsyncStorage.setItem('virai-pending-adventure-open', 'true');
  }
});

AppRegistry.registerComponent(appName, () => App);
