import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { BASE_URL, unwrapApiResponse } from './utils';

// Local path where the uploaded service-account JSON is persisted. Lives
// outside any client-served directory and is gitignored. Survives server
// restarts so the credential remains available without re-uploading.
export const SERVICE_ACCOUNT_FILE = path.resolve(
  process.cwd(),
  '.firebase-service-account.json'
);

function readServiceAccountFromDisk(): string | null {
  try {
    if (fs.existsSync(SERVICE_ACCOUNT_FILE)) {
      const text = fs.readFileSync(SERVICE_ACCOUNT_FILE, 'utf8');
      if (text && text.trim().startsWith('{')) return text;
    }
  } catch {}
  return null;
}

// Firebase Admin app instance (initialized on-demand)
let adminApp: App | null = null;
let isInitializing = false;

// Initialize Firebase Admin SDK with dynamic config from settings API
async function initializeFirebaseAdmin(): Promise<App> {
  // Return existing app if already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }

  // Prevent multiple simultaneous initializations
  if (isInitializing) {
    // Wait for initialization to complete
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const apps = getApps();
    if (apps.length > 0) return apps[0];
  }

  isInitializing = true;

  try {
    // Fetch Firebase config from settings API with timeout
    console.log('🔥 Fetching auth config from settings API...');
    
    const fetchWithTimeout = async (url: string, timeout = 5000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };

    // Use the PUBLIC /settings/keys endpoint to pick up the Firebase web-config
    // fields (project_id, storage_bucket). The /settings endpoint is auth-gated
    // (401 unauthenticated) and not usable from this lazy init context.
    let settings: any = {};
    try {
      const response = await fetchWithTimeout(`${BASE_URL}/settings/keys`, 5000);
      if (response.ok) {
        const rawBody = await response.json();
        settings = unwrapApiResponse(rawBody) || rawBody || {};
      }
    } catch (e) {
      // Quiet — expected when external API is unreachable.
    }

    // Build Firebase config from settings (no hardcoded project fallback;
    // we'll derive missing values from the service-account JSON below).
    const firebaseConfig: any = {};
    if (settings.firebase_project_id) firebaseConfig.projectId = settings.firebase_project_id;
    if (settings.firebase_storage_bucket) firebaseConfig.storageBucket = settings.firebase_storage_bucket;

    // Attach service-account credentials if provided (required for Storage writes,
    // custom-token minting, and any other privileged Admin operation).
    // Resolution order: env var → local disk file → settings field.
    let serviceAccountJson: string | undefined = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    let credentialSource = 'env';
    if (!serviceAccountJson) {
      const fromDisk = readServiceAccountFromDisk();
      if (fromDisk) {
        serviceAccountJson = fromDisk;
        credentialSource = 'disk';
        // Cache in env for subsequent inits in this process.
        process.env.FIREBASE_SERVICE_ACCOUNT_JSON = fromDisk;
      }
    }
    if (!serviceAccountJson) {
      const fromSettings =
        settings.firebase_service_account_json ||
        (settings.firebase_service_account && typeof settings.firebase_service_account === 'object'
          ? JSON.stringify(settings.firebase_service_account)
          : settings.firebase_service_account);
      if (typeof fromSettings === 'string' && fromSettings.trim().startsWith('{')) {
        serviceAccountJson = fromSettings;
        credentialSource = 'settings';
      }
    }

    if (serviceAccountJson) {
      try {
        const parsed = JSON.parse(serviceAccountJson);
        firebaseConfig.credential = cert(parsed);
        // The service account's project_id is authoritative — it dictates which
        // Google Cloud project the credential can actually write to. Override
        // whatever came from settings to avoid cross-project mismatches.
        if (parsed.project_id) {
          firebaseConfig.projectId = parsed.project_id;
          // If no explicit storageBucket was configured (or it's for a different
          // project), default to `{project_id}.firebasestorage.app` — the modern
          // Firebase Storage bucket naming for new projects.
          const expectedPrefix = `${parsed.project_id}.`;
          if (!firebaseConfig.storageBucket || !firebaseConfig.storageBucket.startsWith(expectedPrefix)) {
            firebaseConfig.storageBucket = `${parsed.project_id}.firebasestorage.app`;
          }
        }
        console.log(`🔥 Loaded service-account credentials (source: ${credentialSource})`);
      } catch (e) {
        console.error('❌ Service-account JSON is not valid JSON:', e);
      }
    } else {
      console.warn('⚠️ No service-account credentials found (env or disk or settings) — privileged Admin operations (Storage writes, etc.) will fail');
    }

    // Last-resort defaults so initializeApp doesn't crash if nothing is configured.
    if (!firebaseConfig.projectId) firebaseConfig.projectId = 'tokshop-33509';
    if (!firebaseConfig.storageBucket) firebaseConfig.storageBucket = `${firebaseConfig.projectId}.firebasestorage.app`;

    console.log('🔥 Initializing Admin with config:', {
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      hasCredential: !!firebaseConfig.credential,
    });

    adminApp = initializeApp(firebaseConfig);
    console.log('✅ Admin initialized successfully');
    
    return adminApp;
  } catch (error) {
    console.error('❌ Admin initialization error:', error);
    // Fallback to default config
    const fallbackConfig = {
      projectId: 'tokshop-33509',
      storageBucket: 'tokshop-33509.appspot.com',
    };
    console.log('⚠️ Using fallback auth config');
    adminApp = initializeApp(fallbackConfig);
    return adminApp;
  } finally {
    isInitializing = false;
  }
}

// Reset the cached Admin app so the next getter call re-initializes from
// the latest settings/env. Call this after the service-account credential
// changes (e.g. uploaded or removed via the admin UI).
export async function resetFirebaseAdmin(): Promise<void> {
  try {
    if (adminApp) {
      await adminApp.delete().catch(() => {});
    }
  } finally {
    adminApp = null;
  }
}

// Lazy getters that initialize on first use
export async function getAdminAuth(): Promise<Auth> {
  const app = await initializeFirebaseAdmin();
  return getAuth(app);
}

export async function getAdminStorage(): Promise<Storage> {
  const app = await initializeFirebaseAdmin();
  return getStorage(app);
}

export async function getAdminFirestore(): Promise<Firestore> {
  const app = await initializeFirebaseAdmin();
  return getFirestore(app);
}

// Verify Firebase ID token
export async function verifyFirebaseToken(idToken: string) {
  try {
    const auth = await getAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    return {
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
      provider: decodedToken.firebase.sign_in_provider,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return {
      success: false,
      error: 'Invalid or expired authentication token',
    };
  }
}

// Delete images from Firebase Storage
export async function deleteImagesFromStorage(imageUrls: string[]): Promise<void> {
  if (!imageUrls || imageUrls.length === 0) {
    return;
  }

  const storage = await getAdminStorage();
  const bucket = storage.bucket();
  
  const deletePromises = imageUrls.map(async (url) => {
    try {
      // Extract the file path from Firebase Storage URL
      // Firebase URLs look like: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media...
      const urlParts = url.split('/o/');
      if (urlParts.length < 2) {
        console.warn('Invalid storage URL format:', url);
        return;
      }

      // Decode the file path (it's URL-encoded)
      const encodedPath = urlParts[1].split('?')[0];
      const filePath = decodeURIComponent(encodedPath);

      console.log(`🗑️ Deleting image from storage: ${filePath}`);

      // Delete the file from Storage
      await bucket.file(filePath).delete();
      
      console.log(`✅ Successfully deleted: ${filePath}`);
    } catch (error: any) {
      // Don't throw - log and continue with other deletions
      console.error(`❌ Error deleting image ${url}:`, error.message);
    }
  });

  await Promise.all(deletePromises);
}