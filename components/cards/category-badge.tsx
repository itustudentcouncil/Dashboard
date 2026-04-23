import { Badge } from "@/components/ui/badge";
import { Category } from "@/lib/interfaces/organisations/category";

interface CategoryBadgeProps {
    category: Category;
}

/* Show a badge with organisation category and colour it based on category id */
export function CategoryBadge({ category }: CategoryBadgeProps) {
    return (
        <Badge className={getCategoryBadgeTailwindColour(category.id)}>
            {category.name}
        </Badge>
    );
}

/*
    Associate an organisation category id with a tailwind colour style for the category badge
    Returns the tailwind colour style for the respective category id
    If the category id has no style then a default style is returned
*/
function getCategoryBadgeTailwindColour(categoryId: number): string {
    switch (categoryId) {
        case 1:
            return "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
        case 2:
            return "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300";
        case 3:
            return "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300";
        case 4:
            return "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300";
        case 5:
            return "bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300";
        default:
            return "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300";
    }
}