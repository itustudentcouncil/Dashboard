export interface News {
    id: number;
    title: string;
    description: string;
    banner: string;
    contentPath: string;
    createdAt: string;
    publishedAt?: string;
    isPublished: boolean;
}