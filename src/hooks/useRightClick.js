import { useEffect, useState, useCallback } from "react";

const useRightClick = () => {
    const [isRightClick, setIsRightClick] = useState(false);
    const [rightClickPosition, setRightClickPosition] = useState([0, 0]);

    const handleRightClick = useCallback((e) => {
        e.preventDefault();
        setIsRightClick(!isRightClick);
        setRightClickPosition([e.clientX, e.clientY]);
    }, [isRightClick]);

    const handleLeftClick = useCallback((e) => {
        if (e.button === 0) {
            setIsRightClick(false);
        }
    }, []);

    useEffect(() => {
        window.addEventListener("mousedown", handleLeftClick);
        window.addEventListener("contextmenu", handleRightClick);

        return () => {
            window.removeEventListener("contextmenu", handleRightClick);
            window.removeEventListener("mousedown", handleLeftClick);
        };
    }, [handleLeftClick, handleRightClick]);

    return { clicked: isRightClick, position: rightClickPosition };
};

export default useRightClick;
