// Nhắc nhập chi tiêu hằng ngày
import { isNative, isElectron } from './platform.js';
import { ls } from './util.js';

const KEY = 'mml.reminder';
export const getReminder = () => ls.get(KEY, { enabled: true, time: '20:00' });

export async function applyReminder(r = getReminder(), ask = false) {
  ls.set(KEY, r);
  if (isElectron) { window.mondiro.setReminder(r); return true; }
  if (!isNative) return false;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  try {
    let perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted' && ask) perm = await LocalNotifications.requestPermissions();
    await LocalNotifications.cancel({ notifications: [{ id: 2000 }] }).catch(() => {});
    if (!r.enabled || perm.display !== 'granted') return perm.display === 'granted';
    const [hour, minute] = r.time.split(':').map(Number);
    await LocalNotifications.schedule({
      notifications: [{
        id: 2000,
        title: 'Hôm nay bạn tiêu gì rồi?',
        body: 'Mở Mon Money Lover để ghi lại chi tiêu hôm nay nhé.',
        schedule: { on: { hour, minute }, allowWhileIdle: true },
        extra: { action: 'add' },
      }],
    });
    return true;
  } catch (e) {
    console.warn('reminder', e);
    return false;
  }
}

export async function onReminderTap(cb) {
  if (isElectron) { window.mondiro.onOpenAdd(cb); return; }
  if (!isNative) return;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  LocalNotifications.addListener('localNotificationActionPerformed', () => cb());
}
