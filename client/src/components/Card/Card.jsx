import React, { useContext, useState } from "react";
import AppContext from "../../context/AppContext";
import useCardRender from "../../hooks/useCardRender";
import { css } from "@emotion/css";
import { cn } from "../../utils/cn";

export default function Card(props) {

    const card = props.options.card;
    const renderer = props.options.renderer;
    const rendererId = renderer?.id;
    const id = card?.id;

    // console.log(renderer)

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

    if (!cardLoad) {
        return <div
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
                        top: ${renderer?.y}px;
                        left: ${renderer?.x}px;
                        width: ${renderer?.width * 2}px;
                        height: ${renderer?.height * 2}px;
                        `,
                )}
            >
                <h6 className="translate-y-[-20px] text-gray-200">
                    {card?.segmentID}
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
