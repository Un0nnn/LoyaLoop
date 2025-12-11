# LoyaLoop Test User Credentials

## Default Password for All Users

**Password:** `Password123!`

All test users use the same password for easy testing.

---

## Test User Accounts

### Superuser
```
UTORid: superadmin
Password: Password123!
Email: super@mail.utoronto.ca
Role: Superuser
```
**Access:** Full system access, all permissions

---

### Manager
```
UTORid: manager1
Password: Password123!
Email: manager1@mail.utoronto.ca
Role: Manager
```
**Access:** User management, event management, promotion management, transaction oversight

---

### Cashiers

**Cashier 1:**
```
UTORid: cashier1
Password: Password123!
Email: cashier1@mail.utoronto.ca
Role: Cashier
```

**Cashier 2:**
```
UTORid: cashier2
Password: Password123!
Email: cashier2@mail.utoronto.ca
Role: Cashier
```

**Access:** Create transactions, process purchases, handle redemptions

---

### Regular Users (10 total)

**User 1:**
```
UTORid: alice_wong
Password: Password123!
Email: alice.wong@mail.utoronto.ca
Points: 850
```

**User 2:**
```
UTORid: bob_smith
Password: Password123!
Email: bob.smith@mail.utoronto.ca
Points: 1200
```

**User 3:**
```
UTORid: carol_lee
Password: Password123!
Email: carol.lee@mail.utoronto.ca
Points: 650
```

**User 4:**
```
UTORid: david_chen
Password: Password123!
Email: david.chen@mail.utoronto.ca
Points: 2100
```

**User 5:**
```
UTORid: emma_garcia
Password: Password123!
Email: emma.garcia@mail.utoronto.ca
Points: 450
```

**User 6:**
```
UTORid: frank_kim
Password: Password123!
Email: frank.kim@mail.utoronto.ca
Points: 1800
```

**User 7:**
```
UTORid: grace_patel
Password: Password123!
Email: grace.patel@mail.utoronto.ca
Points: 950
```

**User 8:**
```
UTORid: henry_liu
Password: Password123!
Email: henry.liu@mail.utoronto.ca
Points: 320
```

**User 9:**
```
UTORid: isabel_rodriguez
Password: Password123!
Email: isabel.rodriguez@mail.utoronto.ca
Points: 1450
```

**User 10:**
```
UTORid: jack_nguyen
Password: Password123!
Email: jack.nguyen@mail.utoronto.ca
Points: 780
```

**Access:** View transactions, RSVP to events, transfer points, request redemptions

---

## Quick Test Credentials

### For Testing Different Roles:

| Role | UTORid | Password | Email |
|------|--------|----------|-------|
| Superuser | superadmin | Password123! | super@mail.utoronto.ca |
| Manager | manager1 | Password123! | manager1@mail.utoronto.ca |
| Cashier | cashier1 | Password123! | cashier1@mail.utoronto.ca |
| Regular | alice_wong | Password123! | alice.wong@mail.utoronto.ca |

---

## Sample Data Included

The seed script also creates:
- **30+ transactions** (purchases, redemptions, transfers, adjustments, events)
- **5 events** (enough to test pagination)
- **5 promotions** (automatic and one-time types)
- **Event guests and organizers**
- **Promotion usage records**

---

## How to Seed the Database

### Locally:
```bash
cd /home/ali-gill/Documents/LoyaLoop/backend
npm run seed
```

### On Railway:
The database should be seeded automatically after first deployment, or you can trigger it manually via Railway CLI or web interface.

---

## Security Notes

**These are test credentials for development/demonstration only!**

**For Production:**
- Change all default passwords
- Use strong, unique passwords for each user
- Implement proper user registration flow
- Remove or disable test accounts

---

## Password Requirements

Passwords must meet these requirements:
- 8-20 characters long
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character: `!@#$%^&*()_+-=[]{};':"\\|,.<>/?`

**Example valid passwords:**
- `Password123!` (used in seed data)
- `MyPass456#` 
- `SecureP@ss1` 

**Example invalid passwords:**
- `password` (no uppercase, no number, no special char)
- `PASSWORD123` (no lowercase, no special char)
- `Pass1!` (too short, less than 8 characters)

---

## Troubleshooting Login Issues

### "Invalid username or password" error:

1. **Check UTORid format:**
   - Use the exact UTORid (e.g., `superadmin`, not `super admin`)
   - UTORids are case-sensitive

2. **Check password:**
   - Must be exactly: `Password123!`
   - Case-sensitive (capital P)
   - Includes exclamation mark at the end

3. **Verify database is seeded:**
   - Check Railway logs for seed completion
   - Run seed script if database is empty

4. **Check if user exists:**
   - Try logging in with `superadmin` first
   - If that fails, database might not be seeded

### Database not seeded:

If you see "Invalid username or password" for all accounts:
1. Database might be empty
2. Need to run seed script
3. Check Railway logs for seed errors

**To seed on Railway:**
```bash
# Via Railway CLI
railway run npm run seed

# OR manually trigger via Railway dashboard
# Backend service → Settings → Run command → npm run seed
```

---

## 📞 Quick Reference

**Test Login (Superuser):**
- Username: `superadmin`
- Password: `Password123!`

**Test Login (Regular User):**
- Username: `alice_wong`
- Password: `Password123!`

**All users have the same password for testing convenience.**

---

**Created:** December 11, 2025  
**Password:** Password123! (all accounts)  
**Total Users:** 14 (1 superuser, 1 manager, 2 cashiers, 10 regular users)

