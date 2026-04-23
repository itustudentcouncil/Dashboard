export interface Project {
    id: number;
    title: string;
    banner: string;
    contentPath: string;
    startDate: string;
    endDate?: string;
    isOngoing?: boolean;
}