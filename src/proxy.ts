/**
 * Next.js 16 forward-compatible proxy export.
 * Delegates to updateSession for backward and forward compatibility.
 */
export { updateSession as proxy, updateSession as middleware, config } from './middleware';
