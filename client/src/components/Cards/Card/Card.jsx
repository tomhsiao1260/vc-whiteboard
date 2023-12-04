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

    useEffect(() => {
        PubSub.subscribe("onFinishLoad", (_, { id }) => {
            id === card.id && setIsLoad(true)
        })
        setTimeout(() => {
            setIsLoad(true)
        }, 4000)
    }, [card.id])


    const [opacity, setOpacity] = useState(1)
    useEffect(() => {
        PubSub.publish("onCardOpacityChange", { id: card.id, opacity })
    }, [opacity, card.id])

    const [rotation, setRotation] = useState(0);
    useEffect(() => {
        PubSub.publish("onCardRotationChange", { id: card.id, rotation })
    }, [rotation, card.id])

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
            className="w-full absolute top-[-44px] flex justify-between items-end">
            <p>{card.name}</p>
            <div className="flex flex-col gap-0.5">
                <div className="flex gap-2 text-black">
                    <p className="text-white">rotation</p>
                    <div className="py-1 w-32 bg-transparent flex items-center">
                        <Slider
                            value={[rotation]}
                            onValueChange={(v) => {
                                setRotation(v[0])
                            }}
                            className="w-full" max={360} step={1} />
                    </div>
                </div>
                <div className="flex gap-2 text-black justify-between">
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
            </div>
        </div>}
        {isLoad || <p className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] text-[#DDD] text-xl underline">loading...</p>}
    </div>
}
