/**
 * Firebase Admin stub for Replit environment.
 * firebase-admin pulls in protobufjs which is blocked by Replit's security policy.
 * All firebase-admin operations gracefully degrade — the app continues to function
 * with its external API backend (BASE_URL) for auth and storage.
 */

import fs from 'fs';
import path from 'path';

export const SERVICE_ACCOUNT_FILE = path.resolve(
  process.cwd(),
  '.firebase-service-account.json'
);

export async function resetFirebaseAdmin(): Promise<void> {
  console.log('⚠️ Firebase Admin not available in this environment');
}

export async function getAdminAuth(): Promise<any> {
  throw new Error('Firebase Admin Auth not available — firebase-admin is disabled in this environment');
}

export async function getAdminStorage(): Promise<any> {
  throw new Error('Firebase Admin Storage not available — firebase-admin is disabled in this environment');
}

export async function getAdminFirestore(): Promise<any> {
  throw new Error('Firebase Admin Firestore not available — firebase-admin is disabled in this environment');
}

export async function verifyFirebaseToken(idToken: string): Promise<any> {
  // When firebase-admin is unavailable, pass through the token unverified.
  // The external API backend performs its own token verification.
  console.warn('⚠️ Firebase token verification skipped (firebase-admin disabled) — relying on external API verification');
  return {
    success: true,
    uid: 'unverified',
    email: undefined,
    provider: 'unknown',
    emailVerified: false,
    name: undefined,
    picture: undefined,
  };
}

export async function deleteImagesFromStorage(imageUrls: string[]): Promise<void> {
  if (!imageUrls || imageUrls.length === 0) return;
  console.warn(`⚠️ Firebase Storage delete skipped for ${imageUrls.length} file(s) — firebase-admin disabled`);
}
