import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import tourSteps from './tourSteps';
import TourOverlay from './TourOverlay';
import TourTooltip from './TourTooltip';
import './TourStyles.css';

const TourContext = createContext(null);

export const useTour = () => {
    const ctx = useContext(TourContext);
    if (!ctx) {
        return { startTour: () => {}, endTour: () => {}, isActive: false };
    }
    return ctx;
};

const STORAGE_KEY = 'assetfy_tour_completed';

const TourProvider = ({ children }) => {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const autoStartedRef = useRef(false);
    const findTargetTimerRef = useRef(null);

    const totalSteps = tourSteps.length;

    const findAndHighlightTarget = useCallback((stepIndex) => {
        if (findTargetTimerRef.current) {
            clearTimeout(findTargetTimerRef.current);
        }

        const step = tourSteps[stepIndex];
        if (!step) return;

        const attemptFind = (attempts = 0) => {
            const el = document.querySelector(step.target);
            if (el) {
                const rect = el.getBoundingClientRect();
                setTargetRect({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                });
                setIsNavigating(false);
            } else if (attempts < 15) {
                findTargetTimerRef.current = setTimeout(() => attemptFind(attempts + 1), 200);
            } else {
                // Target not found after 3s, show tooltip centered without spotlight
                setTargetRect(null);
                setIsNavigating(false);
            }
        };

        attemptFind();
    }, []);

    const expandSidebarGroup = useCallback((groupTourId) => {
        if (!groupTourId) return;
        const groupEl = document.querySelector(`[data-tour-id="${groupTourId}"]`);
        if (groupEl) {
            const sidebarItem = groupEl.closest('.sidebar-item');
            const parentDiv = sidebarItem?.parentElement;
            const subItems = parentDiv?.querySelector('.sidebar-sub-items');
            if (!subItems) {
                // Group is collapsed, click to expand
                const clickTarget = sidebarItem?.querySelector('.sidebar-link');
                if (clickTarget) clickTarget.click();
            }
        }
    }, []);

    const goToStep = useCallback((stepIndex) => {
        const step = tourSteps[stepIndex];
        if (!step) return;

        setCurrentStep(stepIndex);
        setIsNavigating(true);

        // Expand sidebar group if needed
        if (step.expandGroup) {
            expandSidebarGroup(step.expandGroup);
        }

        // Navigate if route changed
        if (step.route && location.pathname !== step.route) {
            navigate(step.route);
            // Wait for navigation + render
            setTimeout(() => {
                if (step.expandGroup) {
                    expandSidebarGroup(step.expandGroup);
                    setTimeout(() => findAndHighlightTarget(stepIndex), 300);
                } else {
                    findAndHighlightTarget(stepIndex);
                }
            }, 400);
        } else {
            setTimeout(() => findAndHighlightTarget(stepIndex), 100);
        }
    }, [navigate, location.pathname, findAndHighlightTarget, expandSidebarGroup]);

    const startTour = useCallback(() => {
        setIsActive(true);
        setCurrentStep(0);
        goToStep(0);
    }, [goToStep]);

    const endTour = useCallback(() => {
        setIsActive(false);
        setCurrentStep(0);
        setTargetRect(null);
        setIsNavigating(false);
        localStorage.setItem(STORAGE_KEY, 'true');
        if (findTargetTimerRef.current) {
            clearTimeout(findTargetTimerRef.current);
        }
        navigate('/apoderado/metricas');
    }, [navigate]);

    const nextStep = useCallback(() => {
        if (currentStep < totalSteps - 1) {
            goToStep(currentStep + 1);
        } else {
            endTour();
        }
    }, [currentStep, totalSteps, goToStep, endTour]);

    const prevStep = useCallback(() => {
        if (currentStep > 0) {
            goToStep(currentStep - 1);
        }
    }, [currentStep, goToStep]);

    // Auto-start on first login
    useEffect(() => {
        if (autoStartedRef.current) return;
        const token = localStorage.getItem('token');
        const completed = localStorage.getItem(STORAGE_KEY);
        if (token && completed !== 'true' && location.pathname.startsWith('/apoderado')) {
            autoStartedRef.current = true;
            const timer = setTimeout(() => {
                startTour();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [location.pathname, startTour]);

    // Recalculate position on window resize
    useEffect(() => {
        if (!isActive) return;

        const handleResize = () => {
            findAndHighlightTarget(currentStep);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isActive, currentStep, findAndHighlightTarget]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (findTargetTimerRef.current) {
                clearTimeout(findTargetTimerRef.current);
            }
        };
    }, []);

    const value = {
        startTour,
        endTour,
        nextStep,
        prevStep,
        currentStep,
        totalSteps,
        isActive
    };

    return (
        <TourContext.Provider value={value}>
            {children}
            {isActive && !isNavigating && (
                <>
                    <TourOverlay targetRect={targetRect} />
                    <TourTooltip
                        step={tourSteps[currentStep]}
                        stepIndex={currentStep}
                        totalSteps={totalSteps}
                        targetRect={targetRect}
                        onNext={nextStep}
                        onPrev={prevStep}
                        onSkip={endTour}
                    />
                </>
            )}
        </TourContext.Provider>
    );
};

export default TourProvider;
