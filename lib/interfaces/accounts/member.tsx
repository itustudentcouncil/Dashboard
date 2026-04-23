// A member of an organisation
export interface Member {
  accountId: string;
  name: string;
  email: string;
  profilePath: string | null;
  permissionLevel: number,
  isPublic: boolean,
  createdAt: string;
}