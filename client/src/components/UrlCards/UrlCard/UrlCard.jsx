import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { cn } from "../../../utils/cn"
import { css } from "@emotion/css"
import AppContext from "../../../context/AppContext";
import { filter } from "lodash";

export default function UrlCard({ card }) {

    const inputRef = useRef(null)

    const [inupt, setInput] = useState("");
    const [url, setUrl] = useState("");

    const handleClose = () => {
        PubSub.publish("onUrlCardDelete", { id: card.id })
    }

    useEffect(() => {
        inputRef.current.focus()
    }, [])

    return <div className={cn(
        "fixed translate-x-[-50%]", "flex flex-col gap-2 p-2", css(`
            top: ${card.positionScreen.y}px;
            left: ${card.positionScreen.x}px;
            width: ${card.widthScreen}px;
            height:${card.heightScreen}px;
   
        `))}>
        <div className="bg-[#111]">
            <div className="flex justify-between px-2 text-lg">
                <p>From the web</p>
                <div onClick={handleClose}>[X]</div>
            </div>
            <input
                ref={inputRef}
                value={inupt}
                onChange={(e) => { setInput(e.target.value) }}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        setUrl(inupt)
                    }
                }}
                className={cn("w-full", "text-lg text-[#111]", "p-1")}
                type="text" />
        </div>
        <iframe className="w-full aspect-video" src={url} frameborder="0"></iframe>
    </div>
}
