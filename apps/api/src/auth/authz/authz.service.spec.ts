import { Test, TestingModule } from '@nestjs/testing';
import { AuthzService } from './authz.service';
import { UserService } from '../../user/user.service';
import { RoleService } from '../../role/role.service';
import { PermissionService } from '../../permission/permission.service';

describe('AuthzService', () => {
  let service: AuthzService;

  const mockUserService = {
    findById: jest.fn(),
  };
  const mockRoleService = {
    findOne: jest.fn(),
  };
  const mockPermissionService = {
    getCodesByIds: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthzService,
        { provide: UserService, useValue: mockUserService },
        { provide: RoleService, useValue: mockRoleService },
        { provide: PermissionService, useValue: mockPermissionService },
      ],
    }).compile();

    service = module.get<AuthzService>(AuthzService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPermissionCodesForUser', () => {
    it('returns empty array when user has no roleId', async () => {
      mockUserService.findById.mockResolvedValue({ id: 1, roleId: null });
      const codes = await service.getPermissionCodesForUser(1);
      expect(codes).toEqual([]);
      expect(mockRoleService.findOne).not.toHaveBeenCalled();
      expect(mockPermissionService.getCodesByIds).not.toHaveBeenCalled();
    });
  });

  describe('userHasAnyPermission', () => {
    it('returns true when no codes required', async () => {
      const result = await service.userHasAnyPermission(1, []);
      expect(result).toBe(true);
      expect(mockUserService.findById).not.toHaveBeenCalled();
    });
  });
});
