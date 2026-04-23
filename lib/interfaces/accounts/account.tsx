export interface Account {
  id: string;
  authId: string;
  email: string;
  username: string;
  isGlobalAdministrator: boolean;
  profilePath: string | null;
  createdAt: string;
}