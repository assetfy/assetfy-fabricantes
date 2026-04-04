import React, { useMemo } from 'react';
import animationComponents from './tourAnimations';

const TOOLTIP_MARGIN = 16;

const calculatePosition = (targetRect, placement) => {
    const tooltipWidth = 360;
    const tooltipHeight = 320; // estimated
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    if (!targetRect) {
        // Center on screen
        return {
            top: Math.max(20, (viewportH - tooltipHeight) / 2),
            left: Math.max(20, (viewportW - tooltipWidth) / 2),
            arrowClass: ''
        };
    }

    let top, left, arrowClass;

    switch (placement) {
        case 'right':
            top = targetRect.top - 10;
            left = targetRect.left + targetRect.width + TOOLTIP_MARGIN;
            arrowClass = 'arrow-left';
            // Check right overflow
            if (left + tooltipWidth > viewportW - 20) {
                left = targetRect.left - tooltipWidth - TOOLTIP_MARGIN;
                arrowClass = 'arrow-right';
            }
            break;
        case 'bottom':
            top = targetRect.top + targetRect.height + TOOLTIP_MARGIN;
            left = targetRect.left;
            arrowClass = 'arrow-top';
            // Check bottom overflow
            if (top + tooltipHeight > viewportH - 20) {
                top = targetRect.top - tooltipHeight - TOOLTIP_MARGIN;
                arrowClass = 'arrow-bottom';
            }
            break;
        case 'left':
            top = targetRect.top - 10;
            left = targetRect.left - tooltipWidth - TOOLTIP_MARGIN;
            arrowClass = 'arrow-right';
            if (left < 20) {
                left = targetRect.left + targetRect.width + TOOLTIP_MARGIN;
                arrowClass = 'arrow-left';
            }
            break;
        case 'top':
            top = targetRect.top - tooltipHeight - TOOLTIP_MARGIN;
            left = targetRect.left;
            arrowClass = 'arrow-bottom';
            if (top < 20) {
                top = targetRect.top + targetRect.height + TOOLTIP_MARGIN;
                arrowClass = 'arrow-top';
            }
            break;
        default:
            top = targetRect.top;
            left = targetRect.left + targetRect.width + TOOLTIP_MARGIN;
            arrowClass = 'arrow-left';
    }

    // Clamp to viewport
    top = Math.max(10, Math.min(top, viewportH - tooltipHeight - 10));
    left = Math.max(10, Math.min(left, viewportW - tooltipWidth - 10));

    return { top, left, arrowClass };
};

const TourTooltip = ({ step, stepIndex, totalSteps, targetRect, onNext, onPrev, onSkip }) => {
    const { top, left, arrowClass } = useMemo(
        () => calculatePosition(targetRect, step.placement),
        [targetRect, step.placement]
    );

    const AnimationComponent = step.animation ? animationComponents[step.animation] : null;
    const isLastStep = stepIndex === totalSteps - 1;
    const isFirstStep = stepIndex === 0;

    return (
        <div
            className="tour-tooltip"
            style={{ top, left }}
        >
            {arrowClass && <div className={`tour-tooltip-arrow ${arrowClass}`} />}

            <div className="tour-tooltip-header">
                <h4 className="tour-tooltip-title">{step.title}</h4>
                <button className="tour-tooltip-close" onClick={onSkip} title="Cerrar tour">
                    &times;
                </button>
            </div>

            {AnimationComponent && (
                <div className="tour-animation-container" key={step.id}>
                    <AnimationComponent />
                </div>
            )}

            <p className="tour-tooltip-description">{step.description}</p>

            <div className="tour-step-indicator">
                {Array.from({ length: totalSteps }, (_, i) => (
                    <span
                        key={i}
                        className={`tour-step-dot ${i === stepIndex ? 'active' : ''} ${i < stepIndex ? 'completed' : ''}`}
                    />
                ))}
                <span className="tour-step-text">Paso {stepIndex + 1} de {totalSteps}</span>
            </div>

            <div className="tour-nav-buttons">
                <button className="tour-btn-skip" onClick={onSkip}>
                    Omitir
                </button>
                <div className="tour-nav-right">
                    {!isFirstStep && (
                        <button className="tour-btn-prev" onClick={onPrev}>
                            Anterior
                        </button>
                    )}
                    <button className="tour-btn-next" onClick={onNext}>
                        {isLastStep ? 'Finalizar' : 'Siguiente'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TourTooltip;
