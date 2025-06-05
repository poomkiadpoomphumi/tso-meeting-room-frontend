import { useEffect, useState } from 'react';

export const ResizeDesktop = () => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    // Effect to update windowWidth on resize
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth); // Update width on resize
        };
        window.addEventListener('resize', handleResize); // Listen for resize
        return () => window.removeEventListener('resize', handleResize); // Cleanup
    }, []);
    return windowWidth;
}


