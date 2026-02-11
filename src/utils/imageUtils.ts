
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
        // Replace the storage endpoint with the render endpoint
        let optimizedUrl = url.replace('/storage/v1/object/public/', '/render/image/public/');

        const separator = optimizedUrl.includes('?') ? '&' : '?';
        return `${optimizedUrl}${separator}width=${width}&quality=${quality}&format=webp`;
    }

    return url;
};
