// Configuration file for environment variables
// Replace these with your actual backend domain when deploying

export const config = {
  // Backend API URL for HTTP requests (including /api prefix)
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  
  // Backend host for WebSocket connections (without protocol)
  apiHost: import.meta.env.VITE_API_HOST || 'localhost:5000',
  
  // Clerk authentication publishable key
  clerkPublishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '',
};

// For production deployment, you need to set these environment variables:
// VITE_API_URL=https://your-backend-domain.com/api
// VITE_API_HOST=your-backend-domain.com  
// VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
