import { useEffect, useState } from "react";
import useRightClick from "./useRightClick";

// generate cards, and return card list (url version) that react app need.

export default (whiteboard) => {

    const [cardList, setCardList] = useState([]);

    useEffect(() => {
        // console.log(cardList);
    }, [cardList]);

    return cardList;
};
