import React, { useContext } from 'react'
import AppContext from "../../context/AppContext"
import useGenerateUrlCard from "./hooks/useGenerateUrlCard"
import { filter, map } from "lodash";
import { cn } from "../../utils/cn"
import { css } from "@emotion/css";
import UrlCard from "./UrlCard/UrlCard";

export default function UrlCards() {

    useGenerateUrlCard();

    const { whiteboard } = useContext(AppContext)
    const urlCards = whiteboard ? filter(whiteboard.cards, (card) => card.type === "iframe") : null

    console.log(urlCards)

    return (
        map(urlCards, card => <UrlCard card={card} />)
    )
}
