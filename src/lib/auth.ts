import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import { auth } from './firebase';

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
provider.addScope('https://www.googleapis.com/auth/gmail.send');

let isSigningIn = false;

const TOKEN_KEY = 'gmail_access_token';

const getCachedToken = () => sessionStorage.getItem(TOKEN_KEY);
const setCachedToken = (token: string) => sessionStorage.setItem(TOKEN_KEY, token);
const clearCachedToken = () => sessionStorage.removeItem(TOKEN_KEY);

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Handle the result of a redirect sign-in
  getRedirectResult(auth).then((result) => {
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setCachedToken(credential.accessToken);
        if (onAuthSuccess) onAuthSuccess(result.user, credential.accessToken);
      }
    }
  }).catch((error) => {
    console.error('Redirect sign-in error:', error);
  });

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = getCachedToken();
      if (token) {
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else if (!isSigningIn) {
        // If we have a user but no token (e.g. after refresh), we need them to sign in again 
        // to get a fresh Google access token. 
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      clearCachedToken();
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (isSigningIn) return null;
  
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    setCachedToken(credential.accessToken);
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    
    // If popup is blocked, attempt redirect instead
    if (error.code === 'auth/popup-blocked') {
      console.log('Popup blocked, switching to redirect...');
      await signInWithRedirect(auth, provider);
      return null; // The page will redirect, so we don't return anything yet
    }
    
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const logout = async () => {
  await signOut(auth);
  clearCachedToken();
};
