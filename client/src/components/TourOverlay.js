import React from 'react';

const PADDING = 8;
const BORDER_RADIUS = 8;

const TourOverlay = ({ targetRect }) => {
    if (!targetRect) {
        // No target — just a dimmed overlay
        return (
            <div className="tour-overlay">
                <svg>
                    <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" />
                </svg>
            </div>
        );
    }

    const x = targetRect.left - PADDING;
    const y = targetRect.top - PADDING;
    const w = targetRect.width + PADDING * 2;
    const h = targetRect.height + PADDING * 2;

    return (
        <div className="tour-overlay">
            <svg>
                <defs>
                    <mask id="tour-spotlight-mask">
                        <rect width="100%" height="100%" fill="white" />
                        <rect
                            x={x}
                            y={y}
                            width={w}
                            height={h}
                            rx={BORDER_RADIUS}
                            ry={BORDER_RADIUS}
                            fill="black"
                        />
                    </mask>
                </defs>
                <rect
                    width="100%"
                    height="100%"
                    fill="rgba(0,0,0,0.55)"
                    mask="url(#tour-spotlight-mask)"
                />
                {/* Highlight border around target */}
                <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    rx={BORDER_RADIUS}
                    ry={BORDER_RADIUS}
                    fill="none"
                    stroke="rgba(92, 45, 145, 0.4)"
                    strokeWidth="2"
                />
            </svg>
        </div>
    );
};

export default TourOverlay;
