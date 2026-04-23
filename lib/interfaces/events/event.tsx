import { Organisation } from "../organisations/organisation";

export interface Event {
    id: number;
    name: string;
    description: string;
    time: string;
    date: string;
    organisation?: Organisation;
}