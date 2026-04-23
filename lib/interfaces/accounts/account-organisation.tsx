// The organisations an account is a member of
export interface AccountOrganisation {
    id: number;
    name: string;
    slug: string;
    icon: string;
    permissionLevel: number;
}