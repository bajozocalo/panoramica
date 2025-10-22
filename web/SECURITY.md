# Security Rules Documentation

This document describes the production-grade security rules implemented for Panoramica.digital.

## Table of Contents
- [Overview](#overview)
- [Firestore Security Rules](#firestore-security-rules)
- [Storage Security Rules](#storage-security-rules)
- [Deployment](#deployment)
- [Testing](#testing)
- [Best Practices](#best-practices)
- [Common Scenarios](#common-scenarios)

---

## Overview

The security rules ensure that:
1. **Authentication Required**: Most operations require user authentication
2. **Data Ownership**: Users can only access/modify their own data
3. **Data Validation**: All writes are validated for correct data types and values
4. **Immutable Fields**: Critical fields like credits and timestamps cannot be modified by clients
5. **Cloud Function Only Operations**: Sensitive operations are restricted to Cloud Functions

---

## Firestore Security Rules

### Collections Structure

#### 1. `users/{userId}` Collection
**Purpose**: Store user profile and account information

**Schema**:
```typescript
{
  email: string,              // Required, validated email format
  displayName: string,        // Optional, 1-100 characters
  photoURL: string,           // Optional, avatar URL
  credits: number,            // Required, non-negative integer
  createdAt: timestamp,       // Required, immutable
  metadata: {                 // Optional
    onboardingCompleted: boolean
  }
}
```

**Access Rules**:
- ✅ **Read**: Users can read their own document
- ✅ **Create**: Users can create during signup with 0 credits
- ✅ **Update**: Users can update profile fields (email, displayName, photoURL, metadata)
- ❌ **Update Credits**: Cannot modify credits directly (Cloud Functions only)
- ❌ **Update createdAt**: Immutable field
- ❌ **Delete**: Must be done by admin

**Validations**:
- Email must match valid email regex
- Display name must be 1-100 characters
- New users must start with exactly 0 credits
- Credits must be non-negative integers
- createdAt must be in the past or present

---

#### 2. `generations/{generationId}` Collection
**Purpose**: Store image generation history

**Schema**:
```typescript
{
  userId: string,             // Required, immutable
  createdAt: timestamp,       // Required, immutable
  productType: string,        // Required, immutable
  scenes: string[],           // Required, immutable
  generatedImages: [{         // Required
    url: string,
    thumbnailUrl: string,
    prompt: string,
    isFavorite: boolean       // Only mutable field
  }],
  styles: string[],           // Optional
  moods: string[],            // Optional
  numberOfVariations: number, // Optional
  customPrompt: string,       // Optional
  logoPath: string            // Optional
}
```

**Access Rules**:
- ✅ **Read**: Users can read only their own generations
- ❌ **Create**: Only Cloud Functions can create (prevents fake generations)
- ✅ **Update**: Users can update `generatedImages` array only (for toggling favorites)
- ❌ **Update Immutable Fields**: userId, createdAt, productType, scenes cannot be modified
- ✅ **Delete**: Users can delete their own generations

**Validations**:
- Must be the owner to read/update/delete
- Can only modify the `generatedImages` field on update
- Cannot modify core generation metadata

---

#### 3. `transactions/{transactionId}` Collection
**Purpose**: Store financial transaction history and credit purchases

**Schema**:
```typescript
{
  userId: string,             // Required, immutable
  type: string,               // Required, e.g., 'credit_purchase', 'credit_usage'
  amount: number,             // Required, transaction amount
  credits: number,            // Optional, credits involved
  status: string,             // Required, e.g., 'completed', 'pending', 'failed'
  createdAt: timestamp,       // Required, immutable
  metadata: object            // Optional, additional transaction details
}
```

**Access Rules**:
- ✅ **Read**: Users can read only their own transactions
- ❌ **Create**: Only Cloud Functions (ensures proper validation and logging)
- ❌ **Update**: Immutable once created (audit trail integrity)
- ❌ **Delete**: Cannot be deleted (required for compliance and auditing)

**Use Cases**:
- Credit purchase records
- Credit usage logs
- Payment history
- Refund tracking
- Audit trail for financial compliance

**Important**: Transactions are completely immutable and can only be created by Cloud Functions. This ensures financial data integrity and compliance with audit requirements.

---

#### 4. `usage_stats/{statId}` Collection
**Purpose**: Store user usage analytics and statistics

**Schema**:
```typescript
{
  userId: string,             // Required, immutable
  date: timestamp,            // Required, date of statistics
  generationsCount: number,   // Optional, number of generations
  creditsUsed: number,        // Optional, credits consumed
  imagesGenerated: number,    // Optional, total images created
  metadata: object            // Optional, additional stats
}
```

**Access Rules**:
- ✅ **Read**: Users can read only their own usage stats
- ❌ **Create**: Only Cloud Functions (prevents data manipulation)
- ❌ **Update**: Only Cloud Functions (ensures data accuracy)
- ❌ **Delete**: Cannot be deleted (required for analytics and billing)

**Use Cases**:
- User analytics dashboard
- Usage pattern analysis
- Billing calculations
- Feature usage tracking
- Capacity planning

**Important**: All usage statistics are managed by Cloud Functions to prevent users from manipulating their usage data, which could affect billing or analytics.

---

#### 5. `settings/global` Collection
**Purpose**: Store global app settings (pricing, features, etc.)

**Access Rules**:
- ✅ **Read**: Anyone can read (unauthenticated)
- ❌ **Write**: Only admins via console or Cloud Functions

**Use Cases**:
- Pricing tier information
- Feature flags
- App configuration
- Public announcements

---

#### 4. Stripe Integration Collections

##### `customers/{userId}`
**Purpose**: Stripe customer data (managed by Stripe Extension)

**Access Rules**:
- ✅ **Read**: Users can read their own customer document
- ❌ **Write**: Only Stripe extension

##### `customers/{userId}/checkout_sessions/{sessionId}`
**Purpose**: Stripe checkout sessions

**Access Rules**:
- ✅ **Create**: Users can create checkout sessions
- ✅ **Read**: Users can read their own sessions
- ❌ **Update/Delete**: Only Stripe extension

##### `customers/{userId}/payment_methods/{paymentMethodId}`
**Access Rules**:
- ✅ **Read**: Users can read their own payment methods
- ❌ **Write**: Only Stripe extension

##### `products/{productId}` and `products/{productId}/prices/{priceId}`
**Purpose**: Stripe products and pricing

**Access Rules**:
- ✅ **Read**: Anyone can read
- ❌ **Write**: Only admins/Stripe

---

## Storage Security Rules

### Storage Paths

#### 1. `/uploads/{userId}/{fileName}`
**Purpose**: User-uploaded product images

**Access Rules**:
- ✅ **Read**: Users can read their own uploads
- ✅ **Create/Update**: Users can upload images (under 10MB)
- ✅ **Delete**: Users can delete their own uploads

**Validations**:
- Must be authenticated and owner
- Must be image/* content type
- Must be under 10MB
- Maximum 10 metadata fields

---

#### 2. `/logos/{userId}/{fileName}`
**Purpose**: User-uploaded logos (PNG only)

**Access Rules**:
- ✅ **Read**: Users can read their own logos
- ✅ **Create/Update**: Users can upload PNG logos (under 2MB)
- ✅ **Delete**: Users can delete their own logos

**Validations**:
- Must be authenticated and owner
- Must be PNG format only
- Must be under 2MB
- Maximum 10 metadata fields

---

#### 3. `/avatars/{userId}/{fileName}`
**Purpose**: User profile pictures

**Access Rules**:
- ✅ **Read**: Anyone can read (public for display in UI)
- ✅ **Create/Update**: Users can upload their avatar (under 5MB)
- ✅ **Delete**: Users can delete their own avatar

**Validations**:
- Must be authenticated and owner for write
- Must be image/* content type
- Must be under 5MB
- Maximum 10 metadata fields

**Note**: Avatars are publicly readable so users can see each other's profile pictures.

---

#### 4. `/generated/{userId}/{generationId}/{fileName}`
**Purpose**: AI-generated product images

**Access Rules**:
- ✅ **Read**: Users can read their own generated images
- ❌ **Create**: Only Cloud Functions
- ❌ **Update**: Immutable
- ✅ **Delete**: Users can delete their own generated images

**Note**: Generated images are created by Cloud Functions after successful generation.

---

#### 5. `/thumbnails/{userId}/{path}`
**Purpose**: Auto-generated thumbnails

**Access Rules**:
- ✅ **Read**: Users can read their own thumbnails
- ❌ **Create**: Only Cloud Functions/Extensions
- ❌ **Update**: Immutable
- ✅ **Delete**: Users can delete their own thumbnails

---

#### 6. `/public/{allPaths}`
**Purpose**: Public assets (logos, branding, etc.)

**Access Rules**:
- ✅ **Read**: Anyone can read
- ❌ **Write**: Only admins

---

## Deployment

### Prerequisites
```bash
npm install -g firebase-tools
firebase login
```

### Deploy Security Rules
```bash
# Deploy Firestore rules only
firebase deploy --only firestore:rules

# Deploy Storage rules only
firebase deploy --only storage

# Deploy both
firebase deploy --only firestore:rules,storage

# Deploy everything (rules + indexes)
firebase deploy
```

### Verify Deployment
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Navigate to Firestore Database → Rules
3. Navigate to Storage → Rules
4. Check the "Published" timestamp

---

## Testing

### Local Emulator Testing
```bash
# Start emulators
firebase emulators:start

# Run with UI
firebase emulators:start --import=./emulator-data --export-on-exit
```

Access the Emulator UI at `http://localhost:4000`

### Unit Testing Rules

Create `firestore.rules.test.js`:
```javascript
const firebase = require('@firebase/rules-unit-testing');
const fs = require('fs');

describe('Firestore Security Rules', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await firebase.initializeTestEnvironment({
      projectId: 'panoramica-test',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  test('User can read own document', async () => {
    const alice = testEnv.authenticatedContext('alice');
    await firebase.assertSucceeds(
      alice.firestore().doc('users/alice').get()
    );
  });

  test('User cannot read other user document', async () => {
    const alice = testEnv.authenticatedContext('alice');
    await firebase.assertFails(
      alice.firestore().doc('users/bob').get()
    );
  });

  // Add more tests...
});
```

Run tests:
```bash
npm test
```

---

## Best Practices

### 1. Principle of Least Privilege
- Grant minimum necessary permissions
- Use specific field-level rules where possible
- Default to deny, then allow specific operations

### 2. Validate All Input
- Check data types
- Validate string lengths
- Verify email formats
- Ensure numeric ranges

### 3. Immutable Fields
- Protect critical fields (credits, timestamps, IDs)
- Use `diff()` to detect changes
- Prevent modification after creation

### 4. Cloud Functions for Sensitive Operations
- Credit modifications
- Image generation
- Payment processing
- Admin operations

### 5. Regular Audits
- Review rules quarterly
- Monitor failed security rule attempts
- Update rules when adding features
- Document all rule changes

### 6. Testing Strategy
- Write unit tests for all rules
- Test with authenticated and unauthenticated users
- Test edge cases (empty strings, negative numbers, etc.)
- Use emulators for local testing

---

## Common Scenarios

### Adding a New Field to Users Collection

1. Update `firestore.rules`:
```javascript
allow update: if isOwner(userId)
  && hasOnlyAllowedFields(['email', 'displayName', 'photoURL', 'credits', 'createdAt', 'metadata', 'newField'])
  && (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['credits', 'createdAt']))
  // Add validation for newField
  && (
    !request.resource.data.diff(resource.data).affectedKeys().hasAny(['newField'])
    || isValidNewField(request.resource.data.newField)
  );
```

2. Deploy rules:
```bash
firebase deploy --only firestore:rules
```

3. Update TypeScript interfaces

---

### Adding a New Collection

1. Add rules to `firestore.rules`:
```javascript
match /newCollection/{docId} {
  allow read: if /* conditions */;
  allow create: if /* conditions */;
  allow update: if /* conditions */;
  allow delete: if /* conditions */;
}
```

2. Add indexes if needed in `firestore.indexes.json`

3. Deploy:
```bash
firebase deploy --only firestore
```

---

### Emergency Rule Updates

If you need to temporarily disable rules for debugging:

1. **DO NOT** set rules to `allow read, write: if true;` in production
2. Use emulators for testing
3. Enable Firebase debug logging
4. Check Firestore usage logs in console

---

## Monitoring

### Firebase Console Monitoring

1. **Firestore Usage**:
   - Go to Firestore → Usage
   - Monitor read/write operations
   - Check for unusual spikes

2. **Security Rule Denials**:
   - Go to Firestore → Rules
   - Click "View Rules" → "Evaluation logs"
   - Filter for denied operations

3. **Storage Usage**:
   - Go to Storage → Usage
   - Monitor bandwidth and storage
   - Check for unauthorized access attempts

### Set Up Alerts

In Firebase Console:
1. Go to Project Settings → Integrations
2. Set up Cloud Monitoring
3. Create alert policies for:
   - High number of rule denials
   - Unexpected usage spikes
   - Storage quota approaching limit

---

## Troubleshooting

### Common Issues

#### 1. "Permission Denied" Errors

**Symptoms**: Users getting permission denied when they should have access

**Solutions**:
- Check if user is authenticated
- Verify user ID matches document owner
- Check if required fields are present
- Review validation logic

#### 2. "Missing or Insufficient Permissions"

**Symptoms**: Operations fail with vague error

**Solutions**:
- Enable debug logging in Firebase
- Check emulator logs
- Verify indexes are deployed
- Ensure rules are deployed

#### 3. Performance Issues

**Symptoms**: Slow queries or timeouts

**Solutions**:
- Add composite indexes for complex queries
- Reduce number of documents read
- Use pagination (limit + startAfter)
- Cache frequently accessed data

---

## Security Checklist

Before going to production:

- [ ] All collections have explicit rules
- [ ] Default deny rule at the end (`match /{document=**}`)
- [ ] Authentication required for sensitive data
- [ ] Input validation on all writes
- [ ] Credits cannot be modified by users
- [ ] Timestamps are immutable
- [ ] File size limits enforced
- [ ] File type validation in place
- [ ] User can only access their own data
- [ ] Cloud Functions use service account for admin operations
- [ ] Rules deployed to production
- [ ] Indexes deployed
- [ ] Unit tests written and passing
- [ ] Monitoring and alerts configured

---

## Support and Maintenance

### Update Schedule
- Review rules: Quarterly
- Security audit: Annually
- Update on feature releases: As needed

### Documentation
Keep this document updated when:
- Adding new collections
- Modifying access patterns
- Changing data schemas
- Adding new features

### Contact
For security concerns or questions:
- Open a GitHub issue
- Contact the development team
- Review Firebase security documentation

---

## Additional Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/rules)
- [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Storage Security Rules Guide](https://firebase.google.com/docs/storage/security)
- [Rules Unit Testing](https://firebase.google.com/docs/rules/unit-tests)
- [Security Best Practices](https://firebase.google.com/docs/firestore/security/rules-best-practices)
