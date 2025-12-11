import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for making components draggable with Alt key
 * @param {string} storageKey - LocalStorage key to persist position
 * @param {object} defaultPosition - Default position { top, left, right, bottom }
 * @returns {object} - { position, isDragging, dragHandlers, resetPosition }
 */
const useDraggable = (storageKey, defaultPosition = {}) => {
    const [position, setPosition] = useState(() => {
        // Try to load saved position from localStorage
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.warn('Failed to parse saved position', e);
            }
        }
        return defaultPosition;
    });

    const [isDragging, setIsDragging] = useState(false);
    const [isAltPressed, setIsAltPressed] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const elementStartPos = useRef({ top: 0, left: 0 });

    // Save position to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(position));
    }, [position, storageKey]);

    // Track Alt key state
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.altKey || e.key === 'Alt') {
                setIsAltPressed(true);
                document.body.style.cursor = 'grab';
            }
        };

        const handleKeyUp = (e) => {
            if (!e.altKey && e.key === 'Alt') {
                setIsAltPressed(false);
                document.body.style.cursor = '';
                if (isDragging) {
                    setIsDragging(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            document.body.style.cursor = '';
        };
    }, [isDragging]);

    const handleMouseDown = useCallback((e) => {
        if (!isAltPressed) return;

        e.preventDefault();
        e.stopPropagation();

        setIsDragging(true);
        document.body.style.cursor = 'grabbing';

        // Store initial mouse position
        dragStartPos.current = {
            x: e.clientX,
            y: e.clientY
        };

        // Store initial element position
        const rect = e.currentTarget.getBoundingClientRect();
        elementStartPos.current = {
            top: rect.top,
            left: rect.left
        };
    }, [isAltPressed]);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging || !isAltPressed) return;

        e.preventDefault();

        // Calculate movement delta
        const deltaX = e.clientX - dragStartPos.current.x;
        const deltaY = e.clientY - dragStartPos.current.y;

        // Calculate new position
        const newTop = elementStartPos.current.top + deltaY;
        const newLeft = elementStartPos.current.left + deltaX;

        // Update position (remove auto positioning)
        setPosition({
            top: `${newTop}px`,
            left: `${newLeft}px`,
            right: 'auto',
            bottom: 'auto'
        });
    }, [isDragging, isAltPressed]);

    const handleMouseUp = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
            document.body.style.cursor = isAltPressed ? 'grab' : '';
        }
    }, [isDragging, isAltPressed]);

    // Add global mouse move and mouse up listeners when dragging
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);

            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    const resetPosition = useCallback(() => {
        setPosition(defaultPosition);
        localStorage.removeItem(storageKey);
    }, [defaultPosition, storageKey]);

    const dragHandlers = {
        onMouseDown: handleMouseDown,
        style: {
            ...position,
            cursor: isAltPressed ? 'grab' : 'default',
            userSelect: isDragging ? 'none' : 'auto',
            transition: isDragging ? 'none' : 'all 0.2s ease'
        }
    };

    return {
        position,
        isDragging,
        isAltPressed,
        dragHandlers,
        resetPosition
    };
};

export default useDraggable;

