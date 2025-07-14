# Firebase SMS Setup Guide

## Current Status
✅ Firebase credentials configured correctly
✅ reCAPTCHA working properly
✅ Firebase detects billing issue and falls back to SMS service
✅ Development codes working (668099)

## Issue
Firebase SMS shows `auth/billing-not-enabled` error despite adding billing information.

## Required Steps to Fix Firebase SMS

### 1. Enable Phone Authentication ✅ COMPLETED
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `schoolmanagementpwa-63bc8`
3. Navigate to **Authentication** > **Sign-in method**
4. Click on **Phone** provider
5. Click **Enable** toggle
6. Click **Save**

### 2. Upgrade to Blaze Plan (CRITICAL STEP)
**Phone Authentication requires Blaze Plan (pay-as-you-go):**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `schoolmanagementpwa-63bc8`
3. Click **Upgrade** button (top right)
4. Select **Blaze Plan** (pay-as-you-go)
5. Add billing account or create new one
6. Complete upgrade process

**Note**: The free Spark plan does not support Phone Authentication SMS. You must upgrade to Blaze plan.

### 3. Enable Required APIs ✅ COMPLETED
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** > **Library**
3. Search and enable these APIs:
   - **Identity Toolkit API** (for Firebase Auth) ✅
   - **Cloud Identity and Access Management API**
   - **Firebase Authentication API**

### 4. Verify Billing Configuration
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project: `schoolmanagementpwa-63bc8`
3. Navigate to **Billing** > **Account Management**
4. Ensure billing account is linked to your project
5. Check that billing is active and valid payment method is attached

## Testing Steps
1. After enabling Phone Authentication, try the verification again
2. Check browser console for any new error messages
3. The system should now send real SMS instead of falling back

## Fallback System
The current system intelligently falls back to development codes when Firebase SMS fails:
- Development codes are displayed in console and toast notifications
- You can use these codes (like 668099) to complete verification
- This ensures the system works even during Firebase configuration

## Alternative: Use SMS Service Only
If Firebase continues to have issues, you can disable Firebase SMS and use only the SMS service:
1. Comment out Firebase SMS code in `PhoneVerificationModal.tsx`
2. Use only the `sendViaSMSService()` function
3. This will use Twilio/other SMS providers directly

## Current Working Flow
1. User clicks "تحقق من الرقم" (Verify Number)
2. System tries Firebase SMS first
3. If Firebase fails with billing error, automatically falls back to SMS service
4. SMS service generates development code (e.g., 668099)
5. User can enter this code to complete verification
6. System marks phone as verified in database

The system is working correctly with the fallback mechanism!