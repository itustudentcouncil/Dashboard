import { InviteOrganisation } from "./invite-organisation";
import { Inviter } from "./inviter";

export interface Invite {
    id: string;
    invitedEmail: string;
    permissionLevel: number,
    isPublic: boolean,
    createdAt: string;
    organisation: InviteOrganisation,
    inviter: Inviter
}