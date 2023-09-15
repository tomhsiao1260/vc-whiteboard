import React, { useContext } from "react";
import AppContext from "../../context/AppContext";
import useCardRender from "../../hooks/useCardRender";
import { css } from "@emotion/css";
import { cn } from "../../utils/cn";

export default function Card(props) {

    const card = props.options.card;
    const renderer = props.options.renderer;
    const rendererId = renderer?.id;
    const id = card?.id;

    if (rendererId === id) {

        return (
            <div
                className={cn(
                    styles.card,
                    css`
            top: ${renderer?.y}px;
            left: ${renderer?.x}px;
            width: ${renderer?.width * 2}px;
            height: ${renderer?.height * 2}px;
          `
                )}
            >
                {renderer.isLeave ||
                    <h6 className="translate-y-[-20px] text-gray-200">
                        {card?.segmentID}
                    </h6>
                }

            </div>
        );
    } else {
        // no more code here
    }
}

const styles = {
    card: cn("fixed translate-x-[-50%] translate-y-[-50%]"),
};
