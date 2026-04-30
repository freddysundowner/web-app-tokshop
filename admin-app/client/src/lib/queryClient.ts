import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    let errorData;
    try {
      errorData = JSON.parse(text);
    } catch {
      // not JSON
    }
    
    // If we successfully parsed JSON, check for error messages
    if (errorData) {
      if (errorData.error) {
        if (typeof errorData.error === 'string') {
          throw new Error(errorData.error);
        } else if (typeof errorData.error === 'object') {
          const errorObj = errorData.error;
          if (errorObj.message) {
            throw new Error(errorObj.message);
          } else if (errorObj.error) {
            throw new Error(errorObj.error);
          } else {
            throw new Error(`Validation failed: ${JSON.stringify(errorObj)}`);
          }
        }
      } else if (errorData.message) {
        throw new Error(errorData.message);
      }
    }
    
    // Fallback: show user-friendly message based on status code
    if (res.status === 400) {
      throw new Error("Please check your information and try again.");
    } else if (res.status === 401) {
      throw new Error("Invalid email or password.");
    } else if (res.status === 403) {
      throw new Error("Access denied. Please contact support.");
    } else if (res.status === 404) {
      throw new Error("Service not available. Please try again later.");
    } else if (res.status >= 500) {
      throw new Error("Something went wrong. Please try again later.");
    } else {
      throw new Error("Unable to complete request. Please try again.");
    }
  }
}

export function getAuthHeaders(): Record<string, string> {
  const adminToken = localStorage.getItem('adminAccessToken');
  const userToken = localStorage.getItem('accessToken');
  const userData = localStorage.getItem('user');

  const headers: Record<string, string> = {};

  if (adminToken) {
    headers['x-admin-token'] = adminToken;
    headers['Authorization'] = `Bearer ${adminToken}`;
  }
  if (userToken) {
    headers['x-access-token'] = userToken;
    if (!adminToken) {
      headers['Authorization'] = `Bearer ${userToken}`;
    }
  }
  if (userData) {
    headers['x-user-data'] = btoa(unescape(encodeURIComponent(userData)));
  }

  return headers;
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = getAuthHeaders();
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...authHeaders,
      ...(options.headers as Record<string, string> || {}),
    },
  });
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Use local API endpoints (which proxy to Tokshop API)
  const apiUrl = url;
  
  const adminToken = localStorage.getItem('adminAccessToken');
  const userToken = localStorage.getItem('accessToken');
  const userData = localStorage.getItem('user');
  
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  // Send admin token if available (for admin routes)
  if (adminToken) {
    headers['x-admin-token'] = adminToken;
    headers['Authorization'] = `Bearer ${adminToken}`;
  }
  
  // Send regular user token if available (for all routes)
  if (userToken) {
    headers['x-access-token'] = userToken;
    // Also send as Bearer token if no admin token
    if (!adminToken) {
      headers['Authorization'] = `Bearer ${userToken}`;
    }
  }
  
  // Send user data for session restoration (base64 encoded to handle UTF-8 characters)
  if (userData) {
    headers['x-user-data'] = btoa(unescape(encodeURIComponent(userData)));
  }
  
  const res = await fetch(apiUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const [endpoint, ...params] = queryKey as [string, ...any[]];
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    // Handle different parameter patterns
    if (params.length > 0) {
      // For admin shows: [page, limit, searchTitle, searchType]
      if (endpoint === '/api/admin/shows' && params.length >= 2) {
        const [page, limit, searchTitle, searchType] = params;
        if (page) queryParams.set('page', String(page));
        if (limit) queryParams.set('limit', String(limit));
        if (searchTitle) queryParams.set('title', String(searchTitle));
        if (searchType) queryParams.set('type', String(searchType));
      }
      // For admin users: [page, limit, searchQuery]
      else if (endpoint === '/api/admin/users' && params.length >= 2) {
        const [page, limit, searchQuery] = params;
        if (page) queryParams.set('page', String(page));
        if (limit) queryParams.set('limit', String(limit));
        if (searchQuery) queryParams.set('title', String(searchQuery));
      }
      // For /users search endpoint: [{ title: string }]
      else if (endpoint === '/users' && params.length > 0 && typeof params[0] === 'object') {
        const searchParams = params[0] as Record<string, string>;
        if (searchParams.title) queryParams.set('title', searchParams.title);
      }
      // For other endpoints that use userId pattern
      else if (params[0] && typeof params[0] === 'string') {
        queryParams.set('userId', params[0]);
      }
    }
    
    // Build final URL with query parameters
    const apiUrl = `${endpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const adminToken = localStorage.getItem('adminAccessToken');
    const userToken = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    // Send admin token if available (for admin routes)
    if (adminToken) {
      headers['x-admin-token'] = adminToken;
      headers['Authorization'] = `Bearer ${adminToken}`;
    }
    
    // Send regular user token if available (for all routes)
    if (userToken) {
      headers['x-access-token'] = userToken;
      // Also send as Bearer token if no admin token
      if (!adminToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }
    }
    
    // Send user data for session restoration (base64 encoded to handle UTF-8 characters)
    if (userData) {
      headers['x-user-data'] = btoa(unescape(encodeURIComponent(userData)));
    }
    
    const res = await fetch(apiUrl, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
