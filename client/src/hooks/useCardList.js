import { useEffect, useState } from "react";

// generate cards, and return card list (must contained id) that react app need.

export default () => {
  const [cardList, setCardList] = useState([{ id: 1 }]);
  useEffect(() => {
    // yao's code (may be a function call)
    // do the threejs rendering work.
  }, []);
  return cardList;
};
