import React, { useState } from 'react';

const Avatar = ({ url, username, size = "w-10 h-10", textSize = "text-lg", className = "" }) => {
    const [error, setError] = useState(false);

    // If no URL or error loading image, show initial
    if (!url || error) {
        return (
            <div className={`${size} rounded-full bg-purple-600 flex items-center justify-center text-white font-bold ${textSize} ${className}`}>
                {username ? username.charAt(0).toUpperCase() : '?'}
            </div>
        );
    }

    return (
        <div className={`${size} rounded-full bg-gray-700 overflow-hidden ${className}`}>
            <img
                src={url}
                alt={username}
                className="w-full h-full object-cover"
                onError={() => setError(true)}
            />
        </div>
    );
};

export default Avatar;
