# Firebase Security Rules - Quick Reference

## Quick Commands

```bash
# Deploy all rules
./deploy-rules.sh all

# Deploy specific rules
./deploy-rules.sh firestore
./deploy-rules.sh storage
./deploy-rules.sh indexes

# Interactive mode
./deploy-rules.sh
```

---

## Firestore Rules Summary

| Collection | Read | Create | Update | Delete |
|------------|------|--------|--------|--------|
| `users/{userId}` | Own only | Own only (0 credits) | Own only (no credits/createdAt) | ❌ |
| `generations/{id}` | Own only | ❌ (CF only) | Own only (favorites/status) | Own only |
| `transactions/{id}` | Own only | ❌ (CF only) | ❌ (Immutable) | ❌ (Audit) |
| `usage_stats/{id}` | Own only | ❌ (CF only) | ❌ (CF only) | ❌ |
| `settings/global` | ✅ Anyone | ❌ | ❌ | ❌ |
| `customers/{userId}` | Own only | ❌ (Stripe) | ❌ (Stripe) | ❌ |
| `products/{id}` | ✅ Anyone | ❌ | ❌ | ❌ |

**Legend**: ✅ = Allowed | ❌ = Denied | Own only = User can only access their own | CF = Cloud Functions

---

## Storage Rules Summary

| Path | Read | Write | Max Size | File Types |
|------|------|-------|----------|------------|
| `uploads/{userId}/` | Own only | Own only | 10MB | Images |
| `logos/{userId}/` | Own only | Own only | 2MB | PNG only |
| `avatars/{userId}/` | ✅ Public | Own only | 5MB | Images |
| `generated/{userId}/` | Own only | ❌ (CF only) | N/A | N/A |
| `thumbnails/{userId}/` | Own only | ❌ (CF only) | N/A | N/A |
| `public/` | ✅ Public | ❌ (Admin) | N/A | Any |

---

## Common Operations

### User Profile Update
```typescript
// ✅ ALLOWED
await updateDoc(doc(db, 'users', userId), {
  displayName: 'New Name',
  photoURL: 'https://...'
});

// ❌ DENIED - Cannot modify credits
await updateDoc(doc(db, 'users', userId), {
  credits: 100  // Only Cloud Functions can do this
});
```

### Toggle Favorite
```typescript
// ✅ ALLOWED
await updateDoc(doc(db, 'generations', genId), {
  generatedImages: updatedArray  // Only modifying this field
});

// ✅ ALLOWED - Update status
await updateDoc(doc(db, 'generations', genId), {
  status: 'archived'  // Users can update status
});

// ❌ DENIED - Cannot modify other fields
await updateDoc(doc(db, 'generations', genId), {
  productType: 'shoes'  // Immutable field
});
```

### View Transactions
```typescript
// ✅ ALLOWED - Read own transactions
const q = query(
  collection(db, 'transactions'),
  where('userId', '==', user.uid),
  orderBy('createdAt', 'desc')
);

// ❌ DENIED - Cannot create transactions
await addDoc(collection(db, 'transactions'), {
  userId: user.uid,
  amount: 100
});  // Only Cloud Functions can create
```

### View Usage Stats
```typescript
// ✅ ALLOWED - Read own stats
const q = query(
  collection(db, 'usage_stats'),
  where('userId', '==', user.uid),
  orderBy('date', 'desc')
);

// ❌ DENIED - Cannot modify stats
await updateDoc(doc(db, 'usage_stats', statId), {
  creditsUsed: 0  // Only Cloud Functions can modify
});
```

### Upload Avatar
```typescript
// ✅ ALLOWED
const ref = ref(storage, `avatars/${userId}/photo.jpg`);
await uploadBytes(ref, file);  // Under 5MB, image type

// ❌ DENIED - Wrong path
const ref = ref(storage, `avatars/other-user/photo.jpg`);
await uploadBytes(ref, file);  // Not your own folder
```

---

## Validation Rules

### Email Validation
```
^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
```

### Display Name
- Min: 1 character
- Max: 100 characters

### Credits
- Type: Integer
- Min: 0
- Cannot be modified by users

### File Sizes
- Product images: 10MB max
- Logos: 2MB max (PNG only)
- Avatars: 5MB max

---

## Testing Locally

```bash
# Start emulators
firebase emulators:start

# Access UI
open http://localhost:4000

# Test with curl
curl -X GET http://localhost:8080/v1/projects/PROJECT_ID/databases/(default)/documents/users/USER_ID
```

---

## Emergency Procedures

### Rules Not Working?
1. Check deployment: `firebase deploy --only firestore:rules`
2. Verify in console: Firebase → Firestore → Rules
3. Check logs: Firestore → Rules → Evaluation logs

### Need to Rollback?
1. Go to Firebase Console
2. Firestore → Rules → History
3. Click previous version → Publish

### Debugging
```typescript
// Add to client code temporarily
import { enableIndexedDbPersistence } from 'firebase/firestore';

// Enable debug logging
firebase.firestore.setLogLevel('debug');
```

---

## Security Checklist

Production deployment:
- [ ] Rules deployed
- [ ] Indexes deployed
- [ ] Tested in emulator
- [ ] Verified in console
- [ ] No `allow read, write: if true`
- [ ] All collections covered
- [ ] Default deny at end
- [ ] Monitoring enabled

---

## Key Principles

1. **Default Deny**: Everything denied unless explicitly allowed
2. **Authenticate First**: Most operations require auth
3. **Own Data Only**: Users can only access their own data
4. **Validate Everything**: Check types, ranges, formats
5. **Immutable Critical**: Credits, timestamps, IDs cannot change
6. **Cloud Functions**: Use for sensitive operations
7. **Test Thoroughly**: Use emulators and unit tests

---

## Support

- 📖 Full docs: See `SECURITY.md`
- 🐛 Issues: Check Firebase Console logs
- 💬 Questions: Review Firebase documentation
- 🔒 Security: Follow principle of least privilege
