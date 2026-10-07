export type NotificationStatus = 'default' | 'granted' | 'denied' | 'unsupported';

export interface InAppNotification {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationStatus {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission as NotificationStatus;
}

export async function requestNotificationPermission(): Promise<NotificationStatus> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const perm = await Notification.requestPermission();
    return perm as NotificationStatus;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return 'denied';
  }
}

/**
 * Sends a browser push / system notification
 */
export async function sendPushNotification(
  title: string,
  options: {
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    requireInteraction?: boolean;
    data?: any;
  }
): Promise<boolean> {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported in this browser.');
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    // If Service Worker registration is available, prefer registration.showNotification
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            icon: options.icon || '/icon.svg',
            badge: options.badge || '/icon.svg',
            body: options.body,
            tag: options.tag || 'spesetrack-budget',
            requireInteraction: options.requireInteraction ?? true,
            data: options.data,
          });
          return true;
        }
      } catch (swErr) {
        console.warn('Service worker notification failed, falling back to standard notification', swErr);
      }
    }

    // Fallback to standard window Notification
    new Notification(title, {
      body: options.body,
      icon: options.icon || '/icon.svg',
      tag: options.tag || 'spesetrack-budget',
    });
    return true;
  } catch (error) {
    console.error('Error firing push notification:', error);
    return false;
  }
}

/**
 * Triggers budget exceeded push notification
 */
export async function notifyBudgetExceeded(
  spent: number,
  budget: number,
  monthName: string
): Promise<boolean> {
  const excess = spent - budget;
  return sendPushNotification('⚠️ Budget Mensile Superato!', {
    body: `Attenzione: hai speso €${spent.toFixed(2)} superando il budget fissato a €${budget.toFixed(2)} (+€${excess.toFixed(2)}) per ${monthName}.`,
    tag: `budget-exceeded-${monthName}`,
    requireInteraction: true,
  });
}

/**
 * Triggers budget warning push notification
 */
export async function notifyBudgetWarning(
  spent: number,
  budget: number,
  percentage: number
): Promise<boolean> {
  return sendPushNotification('⚡ Avviso Budget Mensile (85%)', {
    body: `Hai utilizzato il ${Math.round(percentage)}% del budget (€${spent.toFixed(2)} / €${budget.toFixed(2)}). Fai attenzione alle prossime spese!`,
    tag: 'budget-warning-85',
  });
}

/**
 * Send test push notification
 */
export async function triggerTestPushNotification(): Promise<boolean> {
  const perm = await requestNotificationPermission();
  if (perm !== 'granted') {
    return false;
  }

  return sendPushNotification('🔔 Notifiche SpeseTrack Attive!', {
    body: 'Le notifiche push per il superamento del budget sono configurate e pronte.',
    tag: 'test-notification',
  });
}
