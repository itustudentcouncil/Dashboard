import { Organisation } from "../organisations/organisation";

export interface WeeklyEvent {
    id: number;
    name: string;
    time: string;
    dayOfWeek: number; // 1 = Monday, 7 = Sunday
    organisation?: Organisation;
}