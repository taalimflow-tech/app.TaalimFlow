// Firebase has been removed - app now works purely with database authentication
// All authentication is handled by the backend API

console.log("App running in database-only mode - Firebase removed");

// Export null values to maintain compatibility with existing imports
export const auth = null;
export const db = null;
export const storage = null;
export default null;
