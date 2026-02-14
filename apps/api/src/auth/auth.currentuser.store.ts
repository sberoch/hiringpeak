import { ClsStore } from 'nestjs-cls';

export interface CurrentUserStore extends ClsStore {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    active: boolean;
    userType: string;
    roleId: number | null;
    organizationId: number | undefined;
  };
  organizationId?: number;
}
