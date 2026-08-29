import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as fbSignOut, 
  onAuthStateChanged
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase/config';
import { getLocalUsers, getUserCredentials } from '../services/users/userService';
import type { AppUser, UserRole } from '../types';
import { ActivityService } from '../services/activity/activityService';
import { PresenceService } from '../services/presence/presenceService';

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('skylimo_user_session');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) { return null; }
    }
    return null;
  });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        setFirebaseUser(fbUser);
        if (fbUser) {
          try {
            const userDocRef = doc(db, 'users', fbUser.uid);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
              const data = userSnap.data() as AppUser;
              const cleanEmail = (data.email || fbUser.email || '').toLowerCase();
              const effectiveRole: UserRole = cleanEmail === 'admin@skylimobh.com' ? 'admin' : (data.role === 'admin' ? 'staff' : (data.role || 'staff'));
              const normalizedData: AppUser = { ...data, role: effectiveRole };
              setUser(normalizedData);
              localStorage.setItem('skylimo_user_session', JSON.stringify(normalizedData));
            } else {
              // Fetch from local users list or create profile
              const cleanEmail = (fbUser.email || '').toLowerCase();
              const localMatch = getLocalUsers().find((u) => u.email.toLowerCase() === cleanEmail);
              const role: UserRole = cleanEmail === 'admin@skylimobh.com' ? 'admin' : 'staff';
              const displayName = localMatch?.displayName || fbUser.displayName || cleanEmail.split('@')[0] || 'User';

              const newUser: AppUser = {
                uid: fbUser.uid,
                email: cleanEmail,
                displayName,
                role,
                isActive: true,
                createdAt: serverTimestamp(),
                lastLoginAt: serverTimestamp()
              };
              await setDoc(userDocRef, newUser);
              setUser(newUser);
              localStorage.setItem('skylimo_user_session', JSON.stringify(newUser));
            }
          } catch (err) {
            console.warn('Could not fetch user document from Firestore:', err);
          }
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const creds = getUserCredentials();

    try {
      let credential;
      try {
        credential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      } catch (authErr: any) {
        // If not found in Firebase Auth yet, auto-provision if known in credentials store
        const errorCode = authErr?.code || '';
        if (
          (errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-credential' || errorCode === 'auth/invalid-login-credentials') &&
          creds[cleanEmail] === pass
        ) {
          try {
            credential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
          } catch (_) {}
        }
      }

      const allUsers = getLocalUsers();
      const matchedUser = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);

      // Check account activation
      if (matchedUser && !matchedUser.isActive) {
        throw new Error('This account has been deactivated. Please contact an administrator.');
      }

        if (credential?.user) {
        const userDocRef = doc(db, 'users', credential.user.uid);
        let appUserData: AppUser;
        
        try {
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            appUserData = userSnap.data() as AppUser;
          } else {
            const role: UserRole = cleanEmail === 'admin@skylimobh.com' ? 'admin' : 'staff';
            const displayName = matchedUser?.displayName || credential.user.displayName || cleanEmail.split('@')[0];
            appUserData = {
              uid: credential.user.uid,
              email: cleanEmail,
              displayName,
              role,
              isActive: true,
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp()
            };
            await setDoc(userDocRef, appUserData);
          }
        } catch (dbErr) {
          const role: UserRole = cleanEmail === 'admin@skylimobh.com' ? 'admin' : 'staff';
          const displayName = matchedUser?.displayName || cleanEmail.split('@')[0];
          appUserData = {
            uid: credential.user.uid,
            email: cleanEmail,
            displayName,
            role,
            isActive: true
          };
        }

        // Force role based on email
        appUserData.role = cleanEmail === 'admin@skylimobh.com' ? 'admin' : (appUserData.role === 'admin' ? 'staff' : (appUserData.role || 'staff'));

        if (!appUserData.isActive) {
          throw new Error('This account has been deactivated. Please contact an administrator.');
        }

        setUser(appUserData);
        localStorage.setItem('skylimo_user_session', JSON.stringify(appUserData));

        PresenceService.updatePresence(appUserData, '/bookings', false);

        ActivityService.log({
          action: 'login',
          module: 'auth',
          description: `User ${appUserData.displayName || appUserData.email} (${appUserData.role.toUpperCase()}) logged in`,
          user: appUserData
        });
        return;
      }

      // Verification via local credentials store
      if (creds[cleanEmail] && creds[cleanEmail] === pass) {
        const role: UserRole = cleanEmail === 'admin@skylimobh.com' ? 'admin' : 'staff';
        const displayName = matchedUser?.displayName || (cleanEmail === 'admin@skylimobh.com' ? 'Administrator' : 'Staff 1');
        const localUser: AppUser = {
          uid: matchedUser?.uid || ('usr-' + Date.now()),
          email: cleanEmail,
          displayName,
          role,
          isActive: matchedUser?.isActive ?? true
        };

        if (!localUser.isActive) {
          throw new Error('This account has been deactivated. Please contact an administrator.');
        }

        setUser(localUser);
        localStorage.setItem('skylimo_user_session', JSON.stringify(localUser));

        PresenceService.updatePresence(localUser, '/bookings', false);

        ActivityService.log({
          action: 'login',
          module: 'auth',
          description: `User ${localUser.displayName || localUser.email} (${localUser.role.toUpperCase()}) logged in`,
          user: localUser
        });
        return;
      }

      throw new Error('Incorrect email address or password. Please verify and try again.');
    } catch (err: any) {
      throw new Error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (user) {
      PresenceService.setOffline(user);
      ActivityService.log({
        action: 'logout',
        module: 'auth',
        description: `User ${user.displayName || user.email} signed out`,
        user
      });
    }
    try {
      await fbSignOut(auth);
    } catch (_) {}
    setUser(null);
    localStorage.removeItem('skylimo_user_session');
  };

  const isRoleAdmin = Boolean(
    user && 
    user.role === 'admin' && 
    (user.email || '').toLowerCase() === 'admin@skylimobh.com'
  );

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      loading,
      signIn,
      signOut,
      isAdmin: isRoleAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
