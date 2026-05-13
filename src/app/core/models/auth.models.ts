export type UserRole = 'admin' | 'member' | 'superadmin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
}