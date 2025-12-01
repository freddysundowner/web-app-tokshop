import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from "react";
import { onAuthStateChange, signInWithGoogle, signInWithApple, firebaseSignOut, handleAuthRedirect } from "./firebase";
import type { User as FirebaseUser } from "firebase/auth";
import { loginSchema, signupSchema, socialAuthSchema, socialAuthCompleteSchema, type LoginData, type SignupData, type SocialAuthData, type SocialAuthCompleteData } from "@shared/schema";
import { apiRequest } from "./queryClient";
import { useSettings } from "./settings-context";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePhoto?: string;
  userName?: string;
  country?: string;
  phone?: string;
  date_of_birth?: string; // YYYY-MM-DD format
  seller?: boolean;
  admin?: boolean;
  role?: 'superAdmin' | 'admin';
  authProvider?: 'email' | 'google' | 'apple'; // Track how user signed up
  address?: any; // Shipping address from Tokshop API
  defaultpaymentmethod?: any; // Default payment method from Tokshop API
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  pendingSocialAuth: boolean;
  pendingSocialAuthEmail: string | null;
  pendingSocialAuthData: FirebaseUser | null;
  login: (email: string, password: string) => Promise<void>;
  emailLogin: (email: string, password: string) => Promise<void>;
  emailSignup: (email: string, password: string, firstname: string, lastname: string, username: string, phone: string, country: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  completeSocialAuth: (data: SocialAuthCompleteData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  console.log('[AuthProvider] Initializing AuthProvider');
  
  const { isFirebaseReady } = useSettings();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingSocialAuth, setPendingSocialAuth] = useState(false);
  const [pendingSocialAuthEmail, setPendingSocialAuthEmail] = useState<string | null>(null);
  const [pendingSocialAuthData, setPendingSocialAuthData] = useState<FirebaseUser | null>(null);
  const isProcessingRef = useRef(false);
  const hasCheckedAuth = useRef(false);
  const lastRefreshTime = useRef<number>(0);
  const isRefreshing = useRef(false);

  console.log('[AuthProvider] Current state - isLoading:', isLoading, 'user:', user ? user.id : 'null', 'isAuthenticated:', !!user, 'isFirebaseReady:', isFirebaseReady);

  const isAuthenticated = !!user;

  // Call backend social auth API after successful Firebase auth  
  const authenticateWithTokshopRef = useRef<(firebaseUser: FirebaseUser, additionalUserInfo?: any, skipNewUserCheck?: boolean) => Promise<any>>();
  
  authenticateWithTokshopRef.current = async (firebaseUser: FirebaseUser, additionalUserInfo?: any, skipNewUserCheck: boolean = false) => {
    try {
      // Get Firebase ID token for server-side verification
      const idToken = await firebaseUser.getIdToken(true);
      
      // Detect provider type based on provider data
      let authType: 'google' | 'apple' | null = null;
      if (firebaseUser.providerData && firebaseUser.providerData.length > 0) {
        if (firebaseUser.providerData.some(p => p.providerId === 'apple.com')) {
          authType = 'apple';
        } else if (firebaseUser.providerData.some(p => p.providerId === 'google.com')) {
          authType = 'google';
        }
      }
      
      // For Apple, try to get provider info from additionalUserInfo if available
      if (!authType && additionalUserInfo?.providerId === 'apple.com') {
        authType = 'apple';
      } else if (!authType && additionalUserInfo?.providerId === 'google.com') {
        authType = 'google';
      }
      
      // If we still can't determine the provider, this is an error condition
      if (!authType) {
        throw new Error('Unable to determine authentication provider');
      }

      // Extract Apple profile data from additionalUserInfo if available (first-time login)
      let firstName = '';
      let lastName = '';
      let email = firebaseUser.email || '';
      
      if (authType === 'apple' && additionalUserInfo?.profile) {
        // Apple provides profile data only on first sign-in
        const profile = additionalUserInfo.profile;
        if (profile.name) {
          firstName = profile.name.firstName || '';
          lastName = profile.name.lastName || '';
        }
        if (profile.email) {
          email = profile.email;
        }
      } else if (authType === 'google' || !additionalUserInfo?.profile) {
        // Google or subsequent Apple logins - use displayName
        firstName = firebaseUser.displayName?.split(' ')[0] || '';
        lastName = firebaseUser.displayName?.split(' ').slice(1).join(' ') || '';
      }
      
      // For Apple users, skip the user existence check and proceed directly to social auth
      // The backend social auth endpoint will handle user creation/login appropriately

      // Prepare social auth data with Firebase verification info
      const socialAuthData = {
        // Firebase verification data (server will use this for identity)
        idToken: idToken,
        uid: firebaseUser.uid,
        // Profile data (server will use verified Firebase data as primary source)
        email: email,
        firstName: firstName,
        lastName: lastName,
        type: authType,
        profilePhoto: firebaseUser.photoURL || '',
        userName: authType === 'apple' ? '' : (email || firebaseUser.uid), // For Apple, don't set userName as email
        country: '',
        phone: '',
        gender: ''
      };

      // Send to backend with Firebase token - let server handle validation and user correlation
      const response = await apiRequest('POST', '/api/auth/social', socialAuthData);

      const tokshopResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(tokshopResponse.error || `Authentication failed: ${response.status}`);
      }
      
      if (tokshopResponse.success) {
        // Check if this is a new user who needs to complete their profile
        // Only show completion form if explicitly marked as a new user by the backend
        // Skip this check if we already verified user existence before calling this function
        if (!skipNewUserCheck && tokshopResponse.newuser === true) {
          // Set pending social auth state instead of completing authentication
          setPendingSocialAuth(true);
          setPendingSocialAuthEmail(firebaseUser.email || '');
          setPendingSocialAuthData(firebaseUser);
          return tokshopResponse;
        }

        // Existing user - complete authentication immediately
        const userData = {
          id: tokshopResponse.data._id || tokshopResponse.data.id,
          email: tokshopResponse.data.email,
          firstName: tokshopResponse.data.firstName,
          lastName: tokshopResponse.data.lastName || '',
          profilePhoto: tokshopResponse.data.profilePhoto || firebaseUser.photoURL || '',
          userName: tokshopResponse.data.userName,
          country: tokshopResponse.data.country || '',
          phone: tokshopResponse.data.phone || '',
          date_of_birth: tokshopResponse.data.date_of_birth || tokshopResponse.data.dateOfBirth,
          seller: tokshopResponse.data.seller || false,
          admin: tokshopResponse.data.admin || false,
          authProvider: authType as 'google' | 'apple',
          address: tokshopResponse.data.address,
          defaultpaymentmethod: tokshopResponse.data.defaultpaymentmethod
        };
        
        setUser(userData);
        // Store complete user data and access token in localStorage for header-based persistence
        localStorage.setItem('userId', userData.id);
        localStorage.setItem('user', JSON.stringify(userData));
        if (tokshopResponse.accessToken) {
          localStorage.setItem('accessToken', tokshopResponse.accessToken);
        }
        // Clear any pending auth state
        setPendingSocialAuth(false);
        setPendingSocialAuthEmail(null);
        setPendingSocialAuthData(null);
      } else {
        throw new Error(tokshopResponse.message || 'Authentication failed');
      }

      return tokshopResponse;
    } catch (error: any) {
      console.error('Authentication failed:', error?.message || error);
      throw error;
    }
  };
  
  const authenticateWithTokshop = async (firebaseUser: FirebaseUser, additionalUserInfo?: any, skipNewUserCheck: boolean = false) => {
    if (authenticateWithTokshopRef.current) {
      return await authenticateWithTokshopRef.current(firebaseUser, additionalUserInfo, skipNewUserCheck);
    }
  };

  const login = async (email: string, password: string) => {
    return await emailLogin(email, password);
  };

  const emailLogin = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Validate input using schema
      const validatedData = loginSchema.parse({ email, password });
      
      const response = await apiRequest('POST', '/api/auth/login', validatedData);
      const loginResponse = await response.json();
      
      if (loginResponse.success) {
        // Set user data from login response
        const userData = {
          id: loginResponse.data._id || loginResponse.data.id,
          email: loginResponse.data.email,
          firstName: loginResponse.data.firstName,
          lastName: loginResponse.data.lastName || '',
          profilePhoto: loginResponse.data.profilePhoto || '',
          userName: loginResponse.data.userName,
          country: loginResponse.data.country || '',
          phone: loginResponse.data.phone || '',
          date_of_birth: loginResponse.data.date_of_birth || loginResponse.data.dateOfBirth,
          seller: loginResponse.data.seller || false,
          admin: loginResponse.data.admin || false,
          authProvider: 'email' as const,
          address: loginResponse.data.address,
          defaultpaymentmethod: loginResponse.data.defaultpaymentmethod
        };
        
        setUser(userData);
        // Store complete user data and access token in localStorage for header-based persistence
        localStorage.setItem('userId', userData.id);
        localStorage.setItem('user', JSON.stringify(userData));
        if (loginResponse.accessToken) {
          localStorage.setItem('accessToken', loginResponse.accessToken);
        }
      } else {
        // Use the actual API message first, fallback to friendly error, then generic message
        const apiMessage = loginResponse.message || loginResponse.error || 'Login failed';
        throw new Error(apiMessage);
      }
    } catch (error: any) {
      console.error('Email login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const emailSignup = async (email: string, password: string, firstName: string, lastName: string, userName: string, phone: string, country: string) => {
    try {
      setIsLoading(true);
      
      // Validate input using schema
      const validatedData = signupSchema.parse({ email, password, firstName, lastName, userName, phone, country });
      
      const response = await apiRequest('POST', '/api/auth/signup', validatedData);
      const signupResponse = await response.json();
      
      if (signupResponse.success) {
        // Set user data from signup response
        const userData = {
          id: signupResponse.data._id || signupResponse.data.id,
          email: signupResponse.data.email,
          firstName: signupResponse.data.firstName,
          lastName: signupResponse.data.lastName || '',
          profilePhoto: signupResponse.data.profilePhoto || '',
          userName: signupResponse.data.userName,
          country: signupResponse.data.country || country, // Use from signup form
          phone: signupResponse.data.phone || '',
          date_of_birth: signupResponse.data.date_of_birth || signupResponse.data.dateOfBirth,
          seller: signupResponse.data.seller || false,
          admin: signupResponse.data.admin || false,
          authProvider: 'email' as const,
          address: signupResponse.data.address,
          defaultpaymentmethod: signupResponse.data.defaultpaymentmethod
        };
        
        setUser(userData);
        // Store complete user data and access token in localStorage for header-based persistence
        localStorage.setItem('userId', userData.id);
        localStorage.setItem('user', JSON.stringify(userData));
        if (signupResponse.accessToken) {
          localStorage.setItem('accessToken', signupResponse.accessToken);
        }
      } else {
        // Use the actual API message first, fallback to friendly error, then generic message
        const apiMessage = signupResponse.message || signupResponse.error || 'Signup failed';
        throw new Error(apiMessage);
      }
    } catch (error: any) {
      console.error('Email signup failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithGoogle();
      
      if (result?.user) {
        const userEmail = result.user.email;
        
        if (!userEmail) {
          throw new Error('No email found in Google account');
        }
        
        // Check if user exists in the system
        const checkResponse = await apiRequest('GET', `/api/users/userexists/email?email=${encodeURIComponent(userEmail)}`);
        const checkData = await checkResponse.json();
        
        console.log('[loginWithGoogle] User existence check:', checkData);
        
        if (checkData.exists) {
          // User exists - proceed with normal authentication
          await authenticateWithTokshop(result.user, (result as any)?.additionalUserInfo, true);
        } else {
          // User doesn't exist - set pending auth state for data collection
          setPendingSocialAuth(true);
          setPendingSocialAuthEmail(userEmail);
          setPendingSocialAuthData(result.user);
          console.log('[loginWithGoogle] New user detected, redirecting to data collection');
        }
      }
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithApple = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithApple();
      // Handle authentication directly to capture additionalUserInfo for Apple
      if (result?.user) {
        await authenticateWithTokshop(result.user, (result as any)?.additionalUserInfo);
      }
    } catch (error) {
      console.error('Apple login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const completeSocialAuth = async (completionData: SocialAuthCompleteData) => {
    try {
      setIsLoading(true);
      
      if (!pendingSocialAuthData) {
        throw new Error('No pending social authentication data found');
      }

      // Validate input using schema
      const validatedData = socialAuthCompleteSchema.parse(completionData);

      // Detect provider type based on pending auth data
      let authType: 'google' | 'apple' = 'google'; // default
      if (pendingSocialAuthData.providerData && pendingSocialAuthData.providerData.length > 0) {
        if (pendingSocialAuthData.providerData.some(p => p.providerId === 'apple.com')) {
          authType = 'apple';
        } else if (pendingSocialAuthData.providerData.some(p => p.providerId === 'google.com')) {
          authType = 'google';
        }
      }

      // Combine the original Firebase data with the completion data
      const fullSocialAuthData = {
        email: pendingSocialAuthData.email || '',
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        userName: validatedData.userName,
        type: authType,
        profilePhoto: pendingSocialAuthData.photoURL || '',
        country: validatedData.country || '',
        phone: validatedData.phone || '',
        gender: validatedData.gender || ''
      };

      const response = await apiRequest('POST', '/api/auth/social/complete', fullSocialAuthData);
      const completeResponse = await response.json();
      
      if (completeResponse.success) {
        // Set user data from completion response
        const userData = {
          id: completeResponse.data._id || completeResponse.data.id,
          email: completeResponse.data.email,
          firstName: completeResponse.data.firstName,
          lastName: completeResponse.data.lastName || '',
          profilePhoto: completeResponse.data.profilePhoto || pendingSocialAuthData.photoURL || '',
          userName: completeResponse.data.userName,
          country: completeResponse.data.country || '',
          phone: completeResponse.data.phone || '',
          date_of_birth: completeResponse.data.date_of_birth || completeResponse.data.dateOfBirth,
          seller: completeResponse.data.seller || false,
          admin: completeResponse.data.admin || false,
          authProvider: authType as 'google' | 'apple',
          address: completeResponse.data.address,
          defaultpaymentmethod: completeResponse.data.defaultpaymentmethod
        };
        
        setUser(userData);
        // Store complete user data and access token in localStorage for header-based persistence
        localStorage.setItem('userId', userData.id);
        localStorage.setItem('user', JSON.stringify(userData));
        if (completeResponse.accessToken) {
          localStorage.setItem('accessToken', completeResponse.accessToken);
        }

        // Clear pending auth state
        setPendingSocialAuth(false);
        setPendingSocialAuthEmail(null);
        setPendingSocialAuthData(null);
      } else {
        throw new Error(completeResponse.error || 'Failed to complete social authentication');
      }
    } catch (error: any) {
      console.error('Social auth completion failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint to clear HttpOnly cookies
      await apiRequest('POST', '/api/auth/logout', {});
      await firebaseSignOut();
      setUser(null);
      // Clear stored user data and access token
      localStorage.removeItem('userId');
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      // Clear pending auth state
      setPendingSocialAuth(false);
      setPendingSocialAuthEmail(null);
      setPendingSocialAuthData(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Clear user state on error
      setUser(null);
      // Clear stored user data and access token
      localStorage.removeItem('userId');
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      // Clear pending auth state
      setPendingSocialAuth(false);
      setPendingSocialAuthEmail(null);
      setPendingSocialAuthData(null);
    }
  };

  const checkAuthRef = useRef<() => Promise<void>>();
  
  checkAuthRef.current = async () => {
    // Prevent multiple simultaneous calls
    if (hasCheckedAuth.current) {
      console.log('[checkAuth] Already checked, skipping');
      return;
    }
    
    try {
      console.log('[checkAuth] Starting auth check...');
      
      // First handle any pending redirects with a timeout
      const redirectPromise = handleAuthRedirect();
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 2000));
      const redirectResult = await Promise.race([redirectPromise, timeoutPromise]) as any;
      
      if (redirectResult?.user && !isProcessingRef.current) {
        isProcessingRef.current = true;
        try {
          // Handle redirect result with additionalUserInfo
          await authenticateWithTokshop(redirectResult.user, redirectResult?.additionalUserInfo);
        } finally {
          isProcessingRef.current = false;
        }
        return;
      }

      // Check if we have stored user data in localStorage
      const storedUser = localStorage.getItem('user');
      console.log('[checkAuth] localStorage user:', storedUser ? 'EXISTS' : 'NONE');
      
      if (storedUser) {
        try {
          // Parse stored user data first
          const userData = JSON.parse(storedUser);
          console.log('[checkAuth] Setting user from localStorage:', userData.id);
          
          // Ensure address and defaultpaymentmethod fields always exist (even if null)
          // This prevents unnecessary API calls when these fields weren't in old localStorage data
          if (!('address' in userData)) {
            userData.address = null;
          }
          if (!('defaultpaymentmethod' in userData)) {
            userData.defaultpaymentmethod = null;
          }
          
          // Save updated user data back to localStorage with the new fields
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Set user immediately from localStorage
          setUser(userData);
          
          // Fetch fresh user profile from API to validate user exists
          console.log('[checkAuth] Fetching fresh user data from API...');
          
          // Use fetch directly (not apiRequest) so we can check 404 status before it throws
          fetch(`/api/profile/${userData.id}`, {
            method: 'GET',
            credentials: 'include'
          })
            .then(async (res) => {
              // If 404, user doesn't exist in database - log them out
              if (res.status === 404) {
                console.log('[checkAuth] User not found in database (404), logging out...');
                localStorage.removeItem('userId');
                localStorage.removeItem('user');
                localStorage.removeItem('accessToken');
                setUser(null);
                return null;
              }
              
              if (!res.ok) {
                console.log('[checkAuth] Profile fetch failed with status:', res.status);
                return null;
              }
              
              return res.json();
            })
            .then(async (profileData) => {
              // If profileData is null, user was logged out or fetch failed
              if (profileData === null) {
                return;
              }
              
              // User exists, fetch additional data
              const [addressRes, paymentRes] = await Promise.all([
                fetch(`/api/address/default/address/${userData.id}`, { credentials: 'include' })
                  .then(res => res.ok ? res.json() : { address: null })
                  .catch(() => ({ address: null })),
                fetch(`/api/users/paymentmethod/${userData.id}`, { credentials: 'include' })
                  .then(res => res.ok ? res.json() : [])
                  .catch(() => [])
              ]);
              
              const defaultAddress = addressRes?.address || null;
              const hasPaymentMethod = Array.isArray(paymentRes) && paymentRes.length > 0;
              const defaultPaymentMethod = hasPaymentMethod ? paymentRes[0] : null;
              
              // Merge fresh profile data with existing user data
              const updatedUser = {
                ...userData,
                // Update profile fields from fresh data
                firstName: profileData.firstName || userData.firstName,
                lastName: profileData.lastName || userData.lastName,
                userName: profileData.userName || userData.userName,
                email: profileData.email || userData.email,
                profilePhoto: profileData.profilePhoto || userData.profilePhoto,
                coverPhoto: profileData.coverPhoto || userData.coverPhoto,
                bio: profileData.bio || userData.bio,
                phonenumber: profileData.phonenumber || userData.phonenumber,
                applied_seller: profileData.applied_seller ?? userData.applied_seller,
                stripe_account: profileData.stripe_account || userData.stripe_account,
                shipping_settings: profileData.shipping_settings || userData.shipping_settings,
                notification_settings: profileData.notification_settings || userData.notification_settings,
                address: defaultAddress,
                defaultpaymentmethod: defaultPaymentMethod
              };
              
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
              
              console.log('[checkAuth] Fresh user data updated:', {
                hasProfile: true,
                hasAddress: !!defaultAddress,
                hasPayment: !!defaultPaymentMethod,
                profilePhoto: updatedUser.profilePhoto ? 'SET' : 'NONE'
              });
            })
            .catch(error => {
              console.error('[checkAuth] Failed to fetch fresh user data:', error);
            });
        } catch (parseError) {
          // If we can't parse the stored data, clear it
          console.error('Failed to parse stored user data:', parseError);
          localStorage.removeItem('userId');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        // No stored user data, user not authenticated
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Don't clear data on error, just set no user if there's no stored data
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          // Ensure address and defaultpaymentmethod fields always exist
          if (!('address' in userData)) {
            userData.address = null;
          }
          if (!('defaultpaymentmethod' in userData)) {
            userData.defaultpaymentmethod = null;
          }
          // Save updated user data back to localStorage with the new fields
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
        } catch {
          localStorage.removeItem('userId');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } finally {
      console.log('[checkAuth] Auth check complete, setting hasCheckedAuth = true, isLoading = false');
      hasCheckedAuth.current = true;
      setIsLoading(false);
    }
  };

  const checkAuth = async () => {
    if (checkAuthRef.current) {
      await checkAuthRef.current();
    }
  };

  const refreshUserData = async () => {
    try {
      if (!user?.id) {
        console.log('[refreshUserData] No user logged in');
        return;
      }

      // Prevent multiple simultaneous calls
      if (isRefreshing.current) {
        console.log('[refreshUserData] Already refreshing, skipping...');
        return;
      }

      // Debounce: Don't refresh if we refreshed less than 2 seconds ago
      const now = Date.now();
      if (now - lastRefreshTime.current < 2000) {
        console.log('[refreshUserData] Refreshed recently, skipping...');
        return;
      }

      isRefreshing.current = true;
      lastRefreshTime.current = now;

      console.log('[refreshUserData] Fetching latest user data for:', user.id);

      // Fetch default address from the correct endpoint
      const addressResponse = await apiRequest('GET', `/api/address/default/address/${user.id}`);
      const addressResponseData = await addressResponse.json();
      
      // Unwrap the address from the proxy response: { address: {...} }
      const defaultAddress = addressResponseData?.address || null;

      // Fetch payment methods (returns an array)
      const paymentResponse = await apiRequest('GET', `/api/users/paymentmethod/${user.id}`);
      const paymentMethods = await paymentResponse.json();
      
      // Check if there are any payment methods
      // API returns an array directly, e.g., [] or [{...}, {...}]
      const hasPaymentMethod = Array.isArray(paymentMethods) && paymentMethods.length > 0;
      const defaultPaymentMethod = hasPaymentMethod ? paymentMethods[0] : null;

      // Update user context with fresh data
      const updatedUser = {
        ...user,
        address: defaultAddress || null,
        defaultpaymentmethod: defaultPaymentMethod || null
      };

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      console.log('[refreshUserData] User data updated:', {
        hasAddress: !!updatedUser.address,
        hasPayment: !!updatedUser.defaultpaymentmethod
      });
    } catch (error) {
      console.error('[refreshUserData] Failed to refresh user data:', error);
    } finally {
      isRefreshing.current = false;
    }
  };

  useEffect(() => {
    // Only set up Firebase listener after Firebase is initialized
    if (!isFirebaseReady) {
      console.log('[AuthProvider] Waiting for Firebase to be ready...');
      return;
    }

    console.log('[AuthProvider] Firebase ready, setting up auth listener');
    
    // Set up Firebase auth state listener (mainly for logout events now)
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      console.log('[Firebase Listener] Auth state changed, user:', firebaseUser ? 'EXISTS' : 'NONE', 'hasCheckedAuth:', hasCheckedAuth.current);
      
      if (!firebaseUser) {
        setUser(null);
      }
      // Note: Sign-in authentication now handled directly in login functions
      // to properly capture additionalUserInfo
      
      // Only set loading to false after checkAuth has completed
      if (hasCheckedAuth.current) {
        console.log('[Firebase Listener] Setting isLoading = false');
        setIsLoading(false);
      } else {
        console.log('[Firebase Listener] Waiting for checkAuth to complete...');
      }
    });

    // Check for any pending redirects on app load
    checkAuth();

    return () => unsubscribe();
  }, [isFirebaseReady]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    pendingSocialAuth,
    pendingSocialAuthEmail,
    pendingSocialAuthData,
    login,
    emailLogin,
    emailSignup,
    loginWithGoogle,
    loginWithApple,
    completeSocialAuth,
    logout,
    checkAuth,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}