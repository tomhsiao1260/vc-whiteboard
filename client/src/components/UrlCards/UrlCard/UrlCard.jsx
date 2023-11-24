import { useCallback, useContext, useEffect, useState } from "react"
import { cn } from "../../../utils/cn"
import { css } from "@emotion/css"
import AppContext from "../../../context/AppContext";
import { filter } from "lodash";

export default function UrlCard({ card }) {
    const { whiteboard } = useContext(AppContext)

    const [inupt, setInput] = useState("");
    const [url, setUrl] = useState("");

    return <div className={cn(
        "fixed", "flex flex-col gap-2 p-2", css(`
            top: ${card.positionScreen.y}px;
            left: ${card.positionScreen.x - card.widthScreen / 2}px;
            width: ${card.widthScreen}px;
            height:${card.heightScreen}px;
   
        `))}>
        <div className="bg-[#111]">
            <div className="flex justify-between px-2 text-lg">
                <p>From the web</p>
                <div onClick={() => { }}>[X]</div>
            </div>
            <input
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
