# Legacy @Roles to PermissionCode / Guard Mapping

| Controller | Former decorator | New protection |
|------------|------------------|----------------|
| user.controller | @Roles(UserRole.ADMIN) | @Permissions(PermissionCode.USER_MANAGE) |
| area.controller | @Roles(UserRole.ADMIN) | @Permissions(PermissionCode.AREA_MANAGE) |
| vacancystatus.controller | @Roles(UserRole.ADMIN) | @Permissions(PermissionCode.VACANCY_MANAGE) |
| seniority.controller | @Roles(UserRole.ADMIN) | @Permissions(PermissionCode.SETTINGS_MANAGE) |
| industry.controller | @Roles(UserRole.ADMIN) | @Permissions(PermissionCode.SETTINGS_MANAGE) |
| candidatevacancystatus.controller | @Roles(UserRole.ADMIN) | @Permissions(PermissionCode.VACANCY_MANAGE) |
| candidatesource.controller | @Roles(UserRole.ADMIN) | @Permissions(PermissionCode.SETTINGS_MANAGE) |
| permission.controller | @Roles(UserRole.SYSTEM_ADMIN) | InternalUserGuard (userType === INTERNAL_USER) |
| organization.controller | @Roles(UserRole.SYSTEM_ADMIN) | InternalUserGuard |
| onboard.controller | @Roles(UserRole.SYSTEM_ADMIN) | InternalUserGuard |

SYSTEM_ADMIN is not mapped to a permission; backoffice endpoints use InternalUserGuard only.
