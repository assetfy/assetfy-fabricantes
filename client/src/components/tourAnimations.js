import React from 'react';

export const WelcomeAnimation = () => (
    <svg viewBox="0 0 140 80" className="tour-animation-svg">
        <text x="70" y="32" textAnchor="middle" className="tour-anim-welcome-text" fontSize="14" fontWeight="bold" fill="#5C2D91">
            Assetfy
        </text>
        <g className="tour-anim-welcome-stars">
            <circle cx="30" cy="55" r="2" fill="#5C2D91" className="tour-anim-star tour-anim-star-1" />
            <circle cx="55" cy="60" r="2.5" fill="#7B4DB4" className="tour-anim-star tour-anim-star-2" />
            <circle cx="85" cy="58" r="2" fill="#9B6FD4" className="tour-anim-star tour-anim-star-3" />
            <circle cx="110" cy="52" r="2.5" fill="#5C2D91" className="tour-anim-star tour-anim-star-4" />
        </g>
        <line x1="20" y1="42" x2="120" y2="42" stroke="#E0E0E0" strokeWidth="1" className="tour-anim-welcome-line" />
    </svg>
);

export const BarChartAnimation = () => (
    <svg viewBox="0 0 140 80" className="tour-animation-svg">
        <rect x="15" y="60" width="16" height="0" rx="2" fill="#5C2D91" className="tour-anim-bar tour-anim-bar-1" />
        <rect x="38" y="60" width="16" height="0" rx="2" fill="#7B4DB4" className="tour-anim-bar tour-anim-bar-2" />
        <rect x="61" y="60" width="16" height="0" rx="2" fill="#9B6FD4" className="tour-anim-bar tour-anim-bar-3" />
        <rect x="84" y="60" width="16" height="0" rx="2" fill="#5C2D91" className="tour-anim-bar tour-anim-bar-4" />
        <rect x="107" y="60" width="16" height="0" rx="2" fill="#7B4DB4" className="tour-anim-bar tour-anim-bar-5" />
        <line x1="10" y1="65" x2="130" y2="65" stroke="#E0E0E0" strokeWidth="1" />
    </svg>
);

export const AddCardAnimation = () => (
    <svg viewBox="0 0 140 80" className="tour-animation-svg">
        <rect x="20" y="10" width="100" height="55" rx="6" fill="none" stroke="#E0E0E0" strokeWidth="1.5" className="tour-anim-card" />
        <line x1="35" y1="25" x2="85" y2="25" stroke="#E0E0E0" strokeWidth="2" strokeLinecap="round" className="tour-anim-card-line-1" />
        <line x1="35" y1="35" x2="70" y2="35" stroke="#E0E0E0" strokeWidth="2" strokeLinecap="round" className="tour-anim-card-line-2" />
        <g className="tour-anim-plus">
            <circle cx="105" cy="50" r="12" fill="#5C2D91" />
            <line x1="99" y1="50" x2="111" y2="50" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <line x1="105" y1="44" x2="105" y2="56" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </g>
    </svg>
);

export const GearAnimation = () => (
    <svg viewBox="0 0 140 80" className="tour-animation-svg">
        <g transform="translate(70, 40)" className="tour-anim-gear-rotate">
            <path d="M0,-22 L4,-18 L8,-22 L10,-16 L15,-16 L13,-10 L18,-8 L14,-3 L16,2 L11,2 L10,8 L5,5 L0,9 L-5,5 L-10,8 L-11,2 L-16,2 L-14,-3 L-18,-8 L-13,-10 L-15,-16 L-10,-16 L-8,-22 L-4,-18 Z"
                fill="#5C2D91" opacity="0.9" />
            <circle cx="0" cy="0" r="8" fill="white" />
            <circle cx="0" cy="0" r="4" fill="#5C2D91" />
        </g>
    </svg>
);

export const NetworkAnimation = () => (
    <svg viewBox="0 0 140 80" className="tour-animation-svg">
        <line x1="70" y1="25" x2="35" y2="55" stroke="#5C2D91" strokeWidth="1.5" className="tour-anim-network-line tour-anim-network-line-1" />
        <line x1="70" y1="25" x2="105" y2="55" stroke="#5C2D91" strokeWidth="1.5" className="tour-anim-network-line tour-anim-network-line-2" />
        <line x1="35" y1="55" x2="105" y2="55" stroke="#7B4DB4" strokeWidth="1.5" className="tour-anim-network-line tour-anim-network-line-3" />
        <circle cx="70" cy="25" r="8" fill="#5C2D91" className="tour-anim-node tour-anim-node-1" />
        <circle cx="35" cy="55" r="6" fill="#7B4DB4" className="tour-anim-node tour-anim-node-2" />
        <circle cx="105" cy="55" r="6" fill="#9B6FD4" className="tour-anim-node tour-anim-node-3" />
        <text x="70" y="28" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">F</text>
        <text x="35" y="58" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">R</text>
        <text x="105" y="58" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">R</text>
    </svg>
);

export const BellAnimation = () => (
    <svg viewBox="0 0 140 80" className="tour-animation-svg">
        <g transform="translate(70, 40)" className="tour-anim-bell-shake">
            <path d="M0,-20 C-10,-20 -16,-10 -16,0 L-16,5 L-20,10 L20,10 L16,5 L16,0 C16,-10 10,-20 0,-20 Z"
                fill="#5C2D91" />
            <ellipse cx="0" cy="14" rx="5" ry="3" fill="#5C2D91" />
        </g>
        <circle cx="86" cy="22" r="6" fill="#E74C3C" className="tour-anim-badge-pop">
            <animate attributeName="r" values="0;6;5;6" dur="0.5s" begin="1s" fill="freeze" />
        </circle>
        <text x="86" y="25" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold" className="tour-anim-badge-text">3</text>
    </svg>
);

export const ShieldAnimation = () => (
    <svg viewBox="0 0 140 80" className="tour-animation-svg">
        <path d="M70,8 L95,18 L95,42 C95,58 70,70 70,70 C70,70 45,58 45,42 L45,18 Z"
            fill="none" stroke="#5C2D91" strokeWidth="2" className="tour-anim-shield-draw" />
        <polyline points="58,38 67,47 82,32" fill="none" stroke="#5C2D91" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="tour-anim-check-draw" />
    </svg>
);

export const DownloadAnimation = () => (
    <svg viewBox="0 0 140 80" className="tour-animation-svg">
        <rect x="45" y="8" width="50" height="60" rx="4" fill="none" stroke="#E0E0E0" strokeWidth="1.5" />
        <line x1="55" y1="22" x2="85" y2="22" stroke="#E0E0E0" strokeWidth="2" strokeLinecap="round" />
        <line x1="55" y1="30" x2="80" y2="30" stroke="#E0E0E0" strokeWidth="2" strokeLinecap="round" />
        <line x1="55" y1="38" x2="75" y2="38" stroke="#E0E0E0" strokeWidth="2" strokeLinecap="round" />
        <g className="tour-anim-download-arrow">
            <line x1="70" y1="45" x2="70" y2="62" stroke="#5C2D91" strokeWidth="2.5" strokeLinecap="round" />
            <polyline points="62,56 70,64 78,56" fill="none" stroke="#5C2D91" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
    </svg>
);

export const SettingsAnimation = () => (
    <svg viewBox="0 0 140 80" className="tour-animation-svg">
        <g transform="translate(70, 35)" className="tour-anim-settings-rotate">
            <path d="M0,-14 L3,-11 L5,-14 L7,-10 L10,-10 L8,-7 L11,-5 L9,-2 L10,1 L7,1 L6,5 L3,3 L0,6 L-3,3 L-6,5 L-7,1 L-10,1 L-9,-2 L-11,-5 L-8,-7 L-10,-10 L-7,-10 L-5,-14 L-3,-11 Z"
                fill="#5C2D91" opacity="0.85" />
            <circle cx="0" cy="0" r="5" fill="white" />
        </g>
        <g className="tour-anim-settings-items">
            <text x="30" y="62" fontSize="7" fill="#6C757D" className="tour-anim-setting-item tour-anim-setting-1">Marcas</text>
            <text x="58" y="62" fontSize="7" fill="#6C757D" className="tour-anim-setting-item tour-anim-setting-2">Branding</text>
            <text x="92" y="62" fontSize="7" fill="#6C757D" className="tour-anim-setting-item tour-anim-setting-3">Garantias</text>
            <text x="35" y="74" fontSize="7" fill="#6C757D" className="tour-anim-setting-item tour-anim-setting-4">Checklists</text>
            <text x="75" y="74" fontSize="7" fill="#6C757D" className="tour-anim-setting-item tour-anim-setting-5">Importacion</text>
        </g>
    </svg>
);

const animationComponents = {
    welcome: WelcomeAnimation,
    barChart: BarChartAnimation,
    addCard: AddCardAnimation,
    gear: GearAnimation,
    network: NetworkAnimation,
    bell: BellAnimation,
    shield: ShieldAnimation,
    download: DownloadAnimation,
    settings: SettingsAnimation
};

export default animationComponents;
