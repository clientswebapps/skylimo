import { collection, doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { UserPresence, AppUser, PresenceStatus } from '../../types';

const COLLECTION_NAME = 'user_presence';

export function getDeviceType(): 'Desktop' | 'Mobile' | 'Tablet' {
  if (typeof window === 'undefined') return 'Desktop';
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'Tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    return 'Mobile';
  }
  return 'Desktop';
}

export function getBrowserInfo(): string {
  if (typeof window === 'undefined') return 'Web Browser';
  const ua = navigator.userAgent;
  let browser = 'Browser';
  let os = 'Unknown OS';

  if (ua.includes('Win')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
  else if (ua.includes('Firefox/')) browser = 'Firefox';

  return `${browser} (${os})`;
}

export function formatPageName(path: string): string {
  if (!path || path === '/') return 'Dashboard';
  if (path.startsWith('/bookings')) return 'Daily Bookings';
  if (path.startsWith('/rentals')) return 'Car Rentals';
  if (path.startsWith('/reports')) return 'Trips Report';
  if (path.startsWith('/drivers')) return 'Drivers Fleet';
  if (path.startsWith('/vehicles')) return 'Vehicles Fleet';
  if (path.startsWith('/users')) return 'Staff & Users';
  if (path.startsWith('/logs')) return 'Activity Logs';
  if (path.startsWith('/online')) return 'Live Online Users';
  if (path.startsWith('/login')) return 'Login Screen';
  return path.replace('/', '').toUpperCase();
}

function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = sanitizeForFirestore(value);
    }
  }
  return cleaned;
}

export function getPresenceDocId(email: string): string {
  return (email || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
}

export const PresenceService = {
  async updatePresence(user: AppUser | null, currentPath: string, isAway = false): Promise<void> {
    if (!user || !user.email) return;
    const email = user.email.trim().toLowerCase();
    const docId = getPresenceDocId(email);
    const role = email === 'admin@skylimobh.com' ? 'admin' : (user.role === 'admin' ? 'staff' : (user.role || 'staff'));
    const displayName = user.displayName || (email.includes('@') ? email.split('@')[0] : 'User');

    const presenceData: UserPresence = {
      id: docId,
      userId: user.uid || docId,
      userEmail: email,
      userName: displayName,
      userRole: role,
      status: isAway ? 'away' : 'online',
      currentPath: currentPath || '/',
      currentPageName: formatPageName(currentPath),
      deviceType: getDeviceType(),
      browser: getBrowserInfo(),
      lastSeen: new Date().toISOString()
    };

    try {
      const payload = sanitizeForFirestore({
        ...presenceData,
        updatedAt: serverTimestamp()
      });
      await setDoc(doc(db, COLLECTION_NAME, docId), payload, { merge: true });
    } catch (e) {
      console.warn('Presence update error:', e);
    }
  },

  async setOffline(user: AppUser | null): Promise<void> {
    if (!user || !user.email) return;
    const email = user.email.trim().toLowerCase();
    const docId = getPresenceDocId(email);
    try {
      await setDoc(doc(db, COLLECTION_NAME, docId), {
        status: 'offline',
        lastSeen: new Date().toISOString(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (_) {}
  },

  subscribe(callback: (presences: UserPresence[]) => void): () => void {
    let unsubscribeFirestore = () => {};
    try {
      unsubscribeFirestore = onSnapshot(
        collection(db, COLLECTION_NAME),
        (snapshot) => {
          const now = Date.now();
          const list: UserPresence[] = snapshot.docs.map((d) => {
            const data = d.data() as UserPresence;
            const lastSeenTime = data.lastSeen ? new Date(data.lastSeen).getTime() : 0;
            const diffSec = (now - lastSeenTime) / 1000;

            let computedStatus: PresenceStatus = data.status || 'offline';
            if (computedStatus !== 'offline') {
              if (diffSec < 90) {
                computedStatus = 'online';
              } else if (diffSec < 300) {
                computedStatus = 'away';
              } else {
                computedStatus = 'offline';
              }
            }

            return {
              ...data,
              id: d.id,
              status: computedStatus
            };
          });

          // Sort: Online first (0), Away second (1), Offline third (2), then by lastSeen desc
          list.sort((a, b) => {
            const rank = (s: PresenceStatus) => (s === 'online' ? 0 : s === 'away' ? 1 : 2);
            const rankDiff = rank(a.status) - rank(b.status);
            if (rankDiff !== 0) return rankDiff;
            return new Date(b.lastSeen || 0).getTime() - new Date(a.lastSeen || 0).getTime();
          });

          callback(list);
        },
        (err) => {
          console.warn('Presence subscription note:', err);
        }
      );
    } catch (e) {
      console.warn('Presence listener error:', e);
    }

    return () => {
      unsubscribeFirestore();
    };
  }
};
