import { QuickLinkType } from "./quicklink-type";

export interface QuickLink {
    id: number;
    name: string;
    url: string;
    icon?: string;
    type: QuickLinkType;
}