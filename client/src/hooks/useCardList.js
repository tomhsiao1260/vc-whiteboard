import { useEffect, useState } from "react";

// generate cards, and return card list that react app need.

export default (whiteboard) => {
  const [cardList, setCardList] = useState([]);

  useEffect(() => {
    if (whiteboard) {
      // when card generate
      whiteboard.API.on("cardGenerate", (data) => {
        setCardList([data, ...cardList]);
      });
    }
  }, [whiteboard, cardList]);

  useEffect(() => {
    // console.log(cardList);
  }, [cardList]);

  return cardList;
};
