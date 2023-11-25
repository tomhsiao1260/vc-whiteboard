import React, { useContext, useState } from "react";
import AppContext from "../../../context/AppContext";
import useCardRender from "../../../hooks/need-refactor/useCardRender";
import { css } from "@emotion/css";
import { cn } from "../../../utils/cn";

export default function Card(props) {

    const card = props.options.card;
    const renderer = props.options.renderer;
    const rendererId = renderer?.id;
    const id = card?.id;

    const [cardLoad, setCardLoad] = useState(false);
    const [cardSelected, setCardSelected] = useState(false);

    if (!cardLoad && renderer.isLoadId === id) {
        setCardLoad(true);
    }

    if (!cardSelected && id === rendererId) {
        setCardSelected(true)
    }
    if (cardSelected && id !== rendererId) {
        setCardSelected(false)
    }

    console.log(renderer)

    if (!cardLoad) {
        return <div
            className={cn(
                styles.card,
                css`
            top: ${renderer?.y}px;
            left: ${renderer?.x}px;
            width: ${renderer?.width}px;
            height: ${renderer?.height}px;
          `
            )}
        >
            <h6 className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] text-gray-200 text-xl underline">
                Loading...
            </h6>
        </div>
    }

    if (cardSelected) {
        return (
            <div
                className={cn(
                    styles.card,
                    "border-gray-200 border-2",
                    css` 
                        top: ${renderer?.y || -10}px;
                        left: ${renderer?.x || -10}px;
                        width: ${renderer?.width || 0}px;
                        height: ${renderer?.height || 0}px;
                        `,
                )}
            >
                <h6 className="translate-y-[-20px] text-gray-200">
                    {card?.name}
                </h6>
            </div>
        );
    } else {
        return <></>
    }





}

const styles = {
    card: cn("fixed translate-x-[-50%] translate-y-[-50%]"),
};
