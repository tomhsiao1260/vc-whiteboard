import { useEffect, useRef, useState } from "react"
import { cn } from "../../../utils/cn"
import { css } from "@emotion/css"
import { Slider } from "../../ui/Slider"
import { useHover } from "../../../hooks/useHover"

export default function UrlCard({ card }) {

    const inputRef = useRef(null)

    const [inupt, setInput] = useState("");
    const [url, setUrl] = useState("");

    const [hover, isHover] = useHover();
    const [isVisable, setIsVisable] = useState(true);

    const handleClose = () => {
        PubSub.publish("onUrlCardDelete", { id: card.id })
    }

    const handleEnter = () => {
        setIsVisable(true)
    }

    const handleLeave = () => {
        if (url) {
            setIsVisable(false)
        }
    }

    const handleFlip = () => {
        setFlip(!flip)
    }

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const [flip, setFlip] = useState(false);
    useEffect(() => {
        PubSub.publish("onCardFlipChange", { id: card.id, flip })
    }, [flip, card.id])

    const [rotation, setRotation] = useState(180);
    useEffect(() => {
        PubSub.publish("onCardRotationChange", { id: card.id, rotation: rotation - 180 })
    }, [rotation, card.id])

    const [scale, setScale] = useState(1);
    useEffect(() => {
        PubSub.publish("onCardScaleChange", { id: card.id, scale })
    }, [scale, card.id])

    return <div
        ref={hover}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        className={cn(
            "fixed translate-x-[-50%] translate-y-[-50%]", "flex flex-col p-2", css(`
            top: ${card.positionScreen.y}px;
            left: ${card.positionScreen.x}px;
            width: ${card.widthScreen}px;
            height:${card.heightScreen}px;
   
        `))}>
        <div style={{ opacity: isVisable ? 1 : 0 }}
            className="flex flex-col gap-0.5 transition-opacity duration-700 items-end">
            <div className="flex gap-2 text-black">
                <p className="text-white">flip</p>
                <div className="py-1 w-32 bg-transparent flex items-center">
                    <label>
                        <input
                          type="checkbox"
                          name="flip"
                          checked={flip}
                          onChange={handleFlip}
                        />
                    </label>
                </div>
            </div>
        </div>
        <div style={{ opacity: isVisable ? 1 : 0 }}
            className="flex flex-col gap-0.5 transition-opacity duration-700 items-end">
            <div className="flex gap-2 text-black">
                <p className="text-white">scale</p>
                <div className="py-1 w-32 bg-transparent flex items-center">
                    <Slider
                        value={[scale]}
                        onValueChange={(v) => {
                            setScale(v[0])
                        }}
                        className="w-full" max={2} step={0.01} />
                </div>
            </div>
        </div>
        <div style={{ opacity: isVisable ? 1 : 0 }}
            className="flex flex-col gap-0.5 transition-opacity duration-700 items-end">
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
        </div>
        <div
            style={{ opacity: isVisable ? 1 : 0 }}
            className="bg-[#111] z-10 transition-opacity duration-700">
            {card.heightScreen < 150 ? <></> :
                <div className="flex justify-between px-2 text-lg cursor-pointer">
                    <p>From the web</p>
                    <div onClick={handleClose}>[X]</div>
                </div>}
            {card.heightScreen < 280 ? <></> : <input
                ref={inputRef}
                value={inupt}
                onChange={(e) => { setInput(e.target.value) }}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        setUrl(inupt)
                    }
                }}
                className={cn("w-full", "text-lg text-[#111]", "p-1")}
                type="text" />}
        </div>
        <iframe
            style={{
                width: card.widthScreen - 16,
                height: card.heightScreen,
                transformOrigin: 'center',
                transform: `rotate(${rotation - 180}deg) scaleX(${flip ? -1 : 1})`,
            }}
            className="aspect-video" src={url} frameBorder="0"></iframe>
    </div>
}
