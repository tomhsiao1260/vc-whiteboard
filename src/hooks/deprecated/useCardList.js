import { useEffect, useState } from "react";

// generate cards, and return card list that react app need.

export default (app) => {
  const [cardList, setCardList] = useState([]);

  useEffect(() => {
    if (app) {
      // when card generate
      app.API.on("cardGenerate", (data) => {
        setCardList([data, ...cardList]);
      });
    }
  }, [app, cardList]);

  useEffect(() => {
    // console.log(cardList);
  }, [cardList]);

  return cardList;
};
