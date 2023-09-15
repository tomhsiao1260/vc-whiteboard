import { useEffect, useState } from "react";

// generate cards, and return card list (must contained id) that react app need.

export default (WB) => {
  const [cardList, setCardList] = useState([]);
  useEffect(() => {
    if (WB) {
      // when card generate
      WB.API.on("cardGenerate", (data) => {
        setCardList([...cardList, data]);
      });
    }
  }, [WB, cardList]);
  useEffect(() => {
    console.log(cardList);
  }, [cardList]);
  return cardList;
};
