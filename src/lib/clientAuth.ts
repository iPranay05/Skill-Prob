'use client';

// Simple client-side auth helpers for navbar
export async function getCurrentUser() {
    try {
        console.log('🔍 getCurrentUser called');
        const token = localStorage.getItem('accessToken');
        console.log('🎫 Token exists:', !!token);

        if (!token) {
            console.log('❌ No token found');
            return null;
        }

        // For now, just decode the token to get user info
        // In production, you might want to call an API endpoint
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('📋 Token payload:', payload);

        // Check if token is expired
        const isExpired = payload.exp * 1000 < Date.now();
        console.log('⏰ Token expired:', isExpired);

        if (isExpired) {
            console.log('🗑️ Removing expired token');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            return null;
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