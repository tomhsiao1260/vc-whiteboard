import { filter, map } from "lodash";
import React, { useContext, useEffect, useState } from "react";
import TextCard from "./TextCard/TextCard";
import PubSub from "pubsub-js";
import AppContext from "../../context/AppContext";

export default function TextCards() {
  const { whiteboard } = useContext(AppContext);
  const cards = whiteboard
    ? filter(
        whiteboard.cards,
        (card) =>
          card.type.split("/")[0] === "text" ||
          card.type.split("/")[0] === "application"
      )
    : null;

  console.log(cards);

  return map(cards, (card) => <TextCard key={card.id} card={card} />);
}
