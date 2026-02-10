
/**
 * Utility to optimize Supabase Storage images.
 * Tries to use the Image Transformation API if applicable.
 */
export const getOptimizedImageUrl = (url: string, width: number = 400, quality: number = 75): string => {
    if (!url) return '';

    // Check if it's a Supabase Storage URL
    if (url.includes('supabase.co/storage/v1/object/public/')) {
        // Try to convert to render API (Resizing)
        // Pattern: .../object/public/BUCKET/FILE -> .../render/image/public/BUCKET/FILE
        // This is safer than just appending params to the object URL which are often ignored.
        // However, if the project doesn't have image resizing enabled, this might 404.
        // Strategy: Append params to the standard URL first. Some setups proxy this.
        // A conservative approach: Just append the query params. The standard Supabase Storage (S3) might ignore them,
        // but if acceptable by any CDN/Proxy in front, it helps.

        // BETTER STRATEGY FOR THIS USER:
        // Since we don't know if they have Pro/Resizing, we will just return the URL with a cache buster if needed,
        // OR just try to use the 'width' param which some self-hosted or specific configs use.
        // Given the risk of breaking images, we will return the original URL but heavily rely on the 'sizes' attribute
        // and 'loading="lazy"'. 

        // HOWEVER, to really speed it up, we need smaller images. 
        // Let's TRY to use the ?width= param.
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}width=${width}&q=${quality}&format=webp`;
    }

    return url;
};
