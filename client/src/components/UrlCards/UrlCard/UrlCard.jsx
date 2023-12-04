import { useEffect, useRef, useState } from "react"
import { cn } from "../../../utils/cn"
import { css } from "@emotion/css"

export default function UrlCard({ card }) {

    const inputRef = useRef(null)

    const [inupt, setInput] = useState("");
    const [url, setUrl] = useState("");

    const [isVisable, setIsVisable] = useState(true);

    const handleClose = () => {
        PubSub.publish("onUrlCardDelete", { id: card.id })
    }

    const handleEnter = () => {
        setIsVisable(true)
    }

    const handleLeave = () => {
        setIsVisable(false)

    }

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    return <div
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        className={cn(
            "fixed translate-x-[-50%] translate-y-[-50%]", "flex flex-col p-2", css(`
            top: ${card.positionScreen.y}px;
            left: ${card.positionScreen.x}px;
            width: ${card.widthScreen}px;
            height:${card.heightScreen}px;
   
        `))}>
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
            style={{ width: card.widthScreen - 16, height: card.heightScreen }}
            className="aspect-video" src={url} frameBorder="0"></iframe>
    </div>
}
