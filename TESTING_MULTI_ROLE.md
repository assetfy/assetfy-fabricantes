# Multi-Role Feature - Testing Checklist

## Pre-Deployment Testing

### Backend Tests

#### Model Changes
- [x] `usuario.model.js` has `roles` array field
- [x] Migration script syntax is valid (`node -c migrate-roles-to-array.js`)
- [x] Role helper functions are correctly exported

#### API Endpoints - Authentication
- [ ] POST `/api/auth/login` returns both `roles` array and `rol` (primary)
- [ ] JWT token contains `roles` in payload
- [ ] Login with existing users still works after migration

#### API Endpoints - Admin
- [ ] GET `/api/admin/perfil` returns user with `roles` array
- [ ] POST `/api/admin/usuarios/add` accepts `roles` array
- [ ] POST `/api/admin/usuarios/add` accepts single `rol` for backward compatibility
- [ ] PUT `/api/admin/usuarios/:id` updates `roles` array
- [ ] Admin role checks work with multi-role users

#### API Endpoints - Usuario Bienes
- [ ] GET `/api/usuario/bienes` only returns current user's bienes
- [ ] GET `/api/usuario/bienes/:id` only returns bien if owned by current user
- [ ] PUT `/api/usuario/bienes/:id` only updates if owned by current user
- [ ] DELETE `/api/usuario/bienes/:id` only deletes if owned by current user
- [ ] Usuario with multiple roles can access usuario_bienes endpoints

### Frontend Tests

#### Build & Tests
- [x] Frontend builds successfully without errors
- [x] Existing tests pass (24/25, 1 pre-existing failure)
- [x] No new console errors or warnings

#### Login Flow
- [ ] Login stores both `roles` and `rol` in localStorage
- [ ] Navigation redirects to correct panel based on primary role
- [ ] Multi-role users can access all their panels

#### User Management
- [ ] UserForm shows multi-select for roles
- [ ] UserForm help text explains how to multi-select
- [ ] UserForm requires at least one role selected
- [ ] UserEditForm shows existing roles as selected
- [ ] UserEditForm allows adding/removing roles
- [ ] UserList displays roles as comma-separated string
- [ ] UserList role filter works with multi-role users

#### Panel Access
- [ ] PanelMenu shows all panels for multi-role users
- [ ] Admin + Usuario_bienes sees both Admin and Bienes panels
- [ ] Admin + Apoderado sees Admin and Fabricantes panels
- [ ] Apoderado + Usuario_bienes sees Fabricantes and Bienes panels
- [ ] Navigation between panels works correctly

## Post-Migration Testing

### Migration Script
- [ ] Backup database before running migration
- [ ] Run migration script: `node migrate-roles-to-array.js`
- [ ] Verify migration output shows all users migrated
- [ ] Check database: all users have `roles` array
- [ ] No users have empty `roles` array

### Existing User Tests

#### Single Role Users (After Migration)
- [ ] Admin user logs in successfully
- [ ] Admin user sees Admin panel
- [ ] Apoderado user logs in successfully
- [ ] Apoderado user sees Fabricantes panel
- [ ] Usuario_bienes user logs in successfully
- [ ] Usuario_bienes user sees Bienes panel only

#### Data Integrity
- [ ] All users retain their original permissions
- [ ] No data loss during migration
- [ ] User passwords still work
- [ ] User profiles load correctly

### New User Creation Tests

#### Single Role Creation
- [ ] Create user with only Admin role
- [ ] Verify user can access Admin panel
- [ ] Create user with only Apoderado role
- [ ] Verify user can access Fabricantes panel
- [ ] Create user with only Usuario_bienes role
- [ ] Verify user can access Bienes panel

#### Multi-Role Creation
- [ ] Create user with Admin + Usuario_bienes roles
- [ ] Verify user sees both panels in hamburger menu
- [ ] Verify user can switch between panels
- [ ] Create user with Apoderado + Usuario_bienes roles
- [ ] Verify user sees both Fabricantes and Bienes panels
- [ ] Create user with all three roles
- [ ] Verify user sees all three panels

### User Editing Tests

#### Adding Roles
- [ ] Edit existing single-role user
- [ ] Add second role to user
- [ ] User logs out and logs back in
- [ ] Verify user sees both panels
- [ ] Add third role to user with two roles
- [ ] Verify user sees all three panels

#### Removing Roles
- [ ] Edit multi-role user
- [ ] Remove one role
- [ ] Verify user no longer sees removed panel
- [ ] Cannot remove all roles (at least one required)

### Panel Functionality Tests

#### Hamburger Menu
- [ ] Menu shows correct number of panels for user's roles
- [ ] Panel names are correct
- [ ] Panel descriptions are correct
- [ ] Clicking panel navigates correctly
- [ ] Menu closes after selection
- [ ] Menu closes when clicking outside

#### Admin Panel (for users with Admin role)
- [ ] Can view all users
- [ ] Can create new users
- [ ] Can edit users
- [ ] Can delete users
- [ ] Can view fabricantes
- [ ] All admin features work

#### Fabricantes Panel (for users with Apoderado role)
- [ ] Can view own fabricantes
- [ ] Can create productos
- [ ] Can manage inventario
- [ ] All apoderado features work

#### Bienes Panel (for users with Usuario_bienes role)
- [ ] Can view only own bienes (created)
- [ ] Can view only own bienes (registered)
- [ ] Cannot see other users' bienes
- [ ] Can create new bien
- [ ] Can edit own bien
- [ ] Can delete own bien
- [ ] Cannot edit/delete others' bienes

### Security Tests

#### Usuario Bienes Isolation
- [ ] Create two usuario_bienes users (User A, User B)
- [ ] User A creates bienes
- [ ] User B creates bienes
- [ ] User A logs in and sees only their bienes
- [ ] User B logs in and sees only their bienes
- [ ] Try to access User A's bien via API as User B (should fail)

#### Role-Based Access
- [ ] User without Admin role cannot access `/admin`
- [ ] User without Apoderado role cannot create productos
- [ ] User without Usuario_bienes role cannot access `/usuario`
- [ ] Multi-role user can access all their allowed panels
- [ ] Direct URL access is protected by role

### Edge Cases

#### Special Scenarios
- [ ] User with empty roles array (should not be possible)
- [ ] User logs in immediately after role change
- [ ] User has browser tab open when role is changed
- [ ] Multiple users with same roles
- [ ] User email/password change doesn't affect roles

#### Error Handling
- [ ] Invalid role in API request is rejected
- [ ] Missing roles field defaults to ['apoderado']
- [ ] Database connection error during migration is handled
- [ ] Frontend handles missing localStorage gracefully

## Performance Tests

- [ ] Login with multi-role user is not slower
- [ ] Panel switching is smooth
- [ ] User list loads quickly with many users
- [ ] Role filter in UserList performs well
- [ ] Migration script handles large number of users

## Browser Compatibility Tests

Test on multiple browsers:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

## Regression Tests

Verify existing features still work:
- [ ] User activation via email
- [ ] Password reset
- [ ] Profile photo upload
- [ ] Fabricante management
- [ ] Producto/Inventario CRUD
- [ ] Bienes creation and registration
- [ ] QR code generation
- [ ] Export functionality

## Documentation Review

- [x] MULTI_ROLE_FEATURE.md is complete and accurate
- [x] MIGRATION_INSTRUCTIONS.md provides clear steps
- [ ] Code comments are clear and helpful
- [ ] API documentation is updated (if exists)

## Deployment Checklist

- [ ] Backup production database
- [ ] Deploy backend code
- [ ] Deploy frontend build
- [ ] Run migration script on production
- [ ] Verify migration completed successfully
- [ ] Test with production users
- [ ] Monitor error logs for issues
- [ ] Notify users of new multi-role feature

## Rollback Plan

If issues are found:
- [ ] Rollback plan documented in MIGRATION_INSTRUCTIONS.md
- [ ] Database backup is available
- [ ] Previous code version is tagged in git
- [ ] Steps to restore are clear

---

## Test Results Summary

**Date:** ___________  
**Tester:** ___________

**Backend Tests:** ___ / ___ passed  
**Frontend Tests:** ___ / ___ passed  
**Migration Tests:** ___ / ___ passed  
**Security Tests:** ___ / ___ passed  
**Edge Cases:** ___ / ___ passed

**Overall Status:** ☐ PASS ☐ FAIL ☐ NEEDS REVIEW

**Notes:**
____________________________________________
____________________________________________
____________________________________________
