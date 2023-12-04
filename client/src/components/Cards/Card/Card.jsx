import { css } from "@emotion/css"
import { cn } from "../../../utils/cn"
import { useContext, useEffect, useState } from "react"
import AppContext from "../../../context/AppContext"
import { useHover } from "../../../hooks/useHover"
import { Slider } from "../../ui/Slider"

export default function Card({ card }) {

    const { app } = useContext(AppContext)

    const [hover, isHover] = useHover();
    const [isLoad, setIsLoad] = useState(false)

    const [opacity, setOpacity] = useState(1)

    useEffect(() => {
        PubSub.subscribe("onFinishLoad", (_, { id }) => {
            id === card.id && setIsLoad(true)
        })
        setTimeout(() => {
            setIsLoad(true)
        }, 4000)
    }, [card.id])

    useEffect(() => {
        PubSub.publish("onCardOpacityChange", { id, opacity })
    }, [opacity])

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
        {<div
            style={{ opacity: isHover ? 1 : 0 }}
            className="w-full absolute top-[-24px] flex justify-between">
            <p>{card.name}</p>
            <div className="flex gap-2 text-black">
                <p className="text-white">opacity</p>
                <div className="py-1 w-32 bg-transparent flex items-center">
                    <Slider
                        value={[opacity * 100]}
                        onValueChange={(v) => {
                            setOpacity(v[0] / 100)
                        }}
                        className="w-full" max={100} step={1} />
                </div>
            </div>
        </div>}
        {isLoad || <p className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] text-[#DDD] text-xl underline">loading...</p>}
    </div>
}
