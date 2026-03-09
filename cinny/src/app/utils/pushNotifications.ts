/**
 * Android push notifications via Capacitor + FCM.
 * Only runs when the app is running inside the native Android shell (Capacitor).
 * Request permission, register for push, and forward token/events for use with
 * a Matrix push gateway (e.g. Sygnal) if you configure one.
 */

import { Capacitor } from '@capacitor/core';
import {
  PushNotifications,
  type PushNotificationSchema,
  type ActionPerformed,
} from '@capacitor/push-notifications';

const PUSH_TOKEN_KEY = 'cinny_fcm_token';

export function isNativePushAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

/**
 * Call once at app startup when on Android. Requests notification permission,
 * registers for push, and sets up listeners. Store the FCM token (e.g. for
 * Matrix push gateway registration) via getStoredPushToken().
 */
export async function initPushNotifications(): Promise<void> {
  if (!isNativePushAvailable()) return;

  try {
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive !== 'granted') {
      perm = await PushNotifications.requestPermissions();
      if (perm.receive !== 'granted') return;
    }

    await PushNotifications.register();

    PushNotifications.addListener(
      'registration',
      (ev: { value: string }) => {
        const token = ev?.value;
        if (token) {
          try {
            localStorage.setItem(PUSH_TOKEN_KEY, token);
            // Notify the app so it can register this token with the Matrix homeserver.
            window.dispatchEvent(new CustomEvent(FCM_TOKEN_EVENT, { detail: token }));
          } catch {
            // ignore
          }
        }
      }
    );

    PushNotifications.addListener(
      'registrationError',
      (err: { error: unknown }) => {
        console.warn('Push registration error', err?.error);
      }
    );

    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        // Notification delivered to app (foreground). You can show in-app or rely on system.
        // For background, Android shows the notification from FCM payload.
        if (notification.data) {
          // Optional: e.g. navigate to room, badge count
        }
      }
    );

    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        // User tapped the notification. action.notification.data can drive deep link.
        const data = action.notification?.data as Record<string, string> | undefined;
        if (data?.room_id) {
          try {
            window.location.hash = `#/room/${encodeURIComponent(data.room_id)}`;
          } catch {
            // ignore
          }
        }
      }
    );
  } catch (e) {
    console.warn('Push notifications init failed', e);
  }
}

/**
 * Returns the stored FCM token if available (after register() has fired).
 * Use this to register the device with your Matrix push gateway (e.g. Sygnal).
 */
export function getStoredPushToken(): string | null {
  try {
    return localStorage.getItem(PUSH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Event name dispatched when a new FCM token is received (so the app can register with Matrix). */
export const FCM_TOKEN_EVENT = 'cinny-fcm-token';
