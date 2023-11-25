import { css } from "@emotion/css"
import { cn } from "../../../utils/cn"
import { useContext, useEffect, useState } from "react"
import AppContext from "../../../context/AppContext"
import { useHover } from "../../../hooks/useHover"

export default function Card({ card }) {

    const { app } = useContext(AppContext)

    const [hover, isHover] = useHover();
    const [isLoad, setIsLoad] = useState(false)

    useEffect(() => {
        app.API.on("cardLoad", (id) => {
            id === card.id && setIsLoad(true)
        })
    }, [])

    return <div
        ref={hover}
        className={cn(
            "hover:border-[#DDD] border-transparent border-2",
            "fixed translate-x-[-50%] translate-y-[-50%]", css(`
            top: ${card.positionScreen.y}px;
            left: ${card.positionScreen.x}px;
            width: ${card.widthScreen}px;
            height:${card.heightScreen}px;
        `))}>
        {isHover && <p className="absolute top-[-24px]">{card.name}</p>}
        {isLoad || <p className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] text-[#DDD] text-xl underline">loading...</p>}
    </div>
}
