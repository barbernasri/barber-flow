/**
 * middleware/index.js
 * نقطة التصدير المركزية لجميع دوال الـ Middleware
 */

// Core Middleware
export { getCurrentUser, isUserLoggedIn, getCurrentUserId } from './core/auth-state.js';
export { 
    checkRole, 
    checkUserStatus, 
    handleUnauthorizedAccess,
    hasCompletedOnboarding 
} from './core/role-guard.js';
export {
    isSlotAvailable,
    validateBookingData,
    isWithinWorkingHours,
    getAvailableSlots
} from './core/booking-guard.js';
export {
    initializePage,
    initializePublicPage,
    initializeSalonPage,
    initializeStorePage,
    initializeCustomerPage
} from './core/index.js';

// Profile Routing
export {
    navigateToUserDashboard,
    getProfileRoute,
    verifyProfileAccess
} from './core/profile-route.js';

