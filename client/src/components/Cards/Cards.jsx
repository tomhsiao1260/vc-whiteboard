import React, { useContext } from 'react'
import AppContext from "../../context/AppContext"
import { filter, map } from "lodash"
import Card from "./Card/Card"

export default function Cards() {

    const { whiteboard } = useContext(AppContext)
    const cards = whiteboard ? filter(whiteboard.cards, (card) => card.type === "card") : null
    console.log(cards)
    return (
        map(cards, card => <Card key={card.id} card={card}/>)
    )
}
