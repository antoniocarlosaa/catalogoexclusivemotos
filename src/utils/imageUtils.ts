
/**
 * Utility to optimize Supabase Storage images.
 * Tries to use the Image Transformation API if applicable.
 */
export const getOptimizedImageUrl = (url: string, width: number = 500, quality: number = 75): string => {
    if (!url) return '';

    // Check if it's a Supabase Storage URL
    // Standard: https://[project].supabase.co/storage/v1/object/public/[bucket]/[file]
    // Optimized: https://[project].supabase.co/render/image/public/[bucket]/[file]
    if (url.includes('supabase.co/storage/v1/object/public/')) {
        // REVERT: The render/image endpoint might not be enabled for this project.
        // Returning to standard storage URL with query params as best effort.
        // This ensures images load even if optimization is ignored.
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}width=${width}&quality=${quality}&format=webp`;
    }

    return url;
};
