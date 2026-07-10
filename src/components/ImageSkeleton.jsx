import React from 'react';

const ImageSkeleton = ({ aspectRatio = 1 }) => (
  <div
    className="skeleton-shimmer rounded-sm overflow-hidden"
    style={{
      width: '100%',
      paddingBottom: `${(1 / aspectRatio) * 100}%`,
    }}
  />
);

export default ImageSkeleton;
