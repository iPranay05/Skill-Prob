'use client';

// Token refresh function
async function refreshAccessToken(): Promise<boolean> {
    try {
        console.log('🔄 Attempting to refresh token');
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
            console.log('❌ No refresh token found');
            return false;
        }

        const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Token refreshed successfully');
            
            // Store new tokens
            localStorage.setItem('accessToken', data.data.accessToken);
            localStorage.setItem('refreshToken', data.data.refreshToken);
            
            return true;
        } else {
            console.log('❌ Token refresh failed:', response.status);
            // Clear invalid tokens
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            return false;
        }
    } catch (error) {
        console.error('❌ Error refreshing token:', error);
        // Clear tokens on error
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return false;
    }
}

// Simple client-side auth helpers for navbar
export async function getCurrentUser() {
    try {
        console.log('🔍 getCurrentUser called');
        let token = localStorage.getItem('accessToken');
        console.log('🎫 Token exists:', !!token);

        if (!token) {
            console.log('❌ No token found');
            return null;
        }

        // Decode the token to get user info
        let payload;
        try {
            payload = JSON.parse(atob(token.split('.')[1]));
            console.log('📋 Token payload:', payload);
        } catch (error) {
            console.error('❌ Invalid token format');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            return null;
        }

        // Check if token is expired
        const isExpired = payload.exp * 1000 < Date.now();
        console.log('⏰ Token expired:', isExpired);

        if (isExpired) {
            console.log('🔄 Token expired, attempting refresh');
            const refreshed = await refreshAccessToken();
            
            if (!refreshed) {
                console.log('❌ Token refresh failed');
                return null;
            }

            // Get the new token and decode it
            token = localStorage.getItem('accessToken');
            if (!token) {
                console.log('❌ No token after refresh');
                return null;
            }

            try {
                payload = JSON.parse(atob(token.split('.')[1]));
                console.log('📋 New token payload:', payload);
            } catch (error) {
                console.error('❌ Invalid refreshed token format');
                return null;
            }
        }

        const user = {
            id: payload.userId,
            name: payload.name || 'User',
            email: payload.email,
            role: payload.role
        };

        console.log('👤 Returning user:', user);
        return user;
    } catch (error) {
        console.error('❌ Error getting current user:', error);
        return null;
    }
}

export function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
}

// Helper function for making authenticated API calls with automatic token refresh
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    let token = localStorage.getItem('accessToken');
    
    if (!token) {
        throw new Error('No access token available');
    }

    // Add authorization header
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
    };

    // Make the initial request
    let response = await fetch(url, {
        ...options,
        headers,
    });

    // If we get a 401, try to refresh the token and retry
    if (response.status === 401) {
        console.log('🔄 Got 401, attempting token refresh');
        const refreshed = await refreshAccessToken();
        
        if (refreshed) {
            // Retry with new token
            token = localStorage.getItem('accessToken');
            const newHeaders = {
                ...options.headers,
                'Authorization': `Bearer ${token}`,
            };

            response = await fetch(url, {
                ...options,
                headers: newHeaders,
            });
        }
    }

    return response;
}