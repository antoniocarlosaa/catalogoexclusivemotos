import React from 'react';

interface HeroSearchProps {
    backgroundImageUrl?: string;
    backgroundPosition?: string;
}

const HeroSearch: React.FC<HeroSearchProps> = ({ backgroundImageUrl, backgroundPosition }) => {
    return (
        <div className="relative w-full rounded-[2.5rem] overflow-hidden h-[35vh] min-h-[300px] mb-8 group">
            {/* Background Image */}
            {backgroundImageUrl ? (
                <div
                    className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-[2000ms] group-hover:scale-105"
                    style={{
                        backgroundImage: `url(${backgroundImageUrl})`,
                        backgroundPosition: backgroundPosition || '50% 50%',
                    }}
                />
            ) : (
                <div className="absolute inset-0 bg-neutral-900 z-0" />
            )}

            {/* Gradient Overlay for Text Readability & Seamless Blend */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#050505] z-10" />

            {/* Optional: Add a subtle texture or noise if desired, avoiding for now to keep it clean */}
        </div>

    );
};

export default HeroSearch;
