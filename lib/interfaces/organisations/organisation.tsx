import { Category } from "./category";

export interface Organisation {
    id: number;
    name: string;
    description: string;
    slug: string;
    banner: string;
    icon: string;
    category?: Category;
}