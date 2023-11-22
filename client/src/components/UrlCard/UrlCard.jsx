import { useCallback, useEffect, useState } from "react"
import { cn } from "../../utils/cn"
import useRightClick from "../../hooks/useRightClick"
import PubSub from "pubsub-js"

export default function UrlCard() {

    // const [url, setUrl] = useState("")
    // const { clicked, position } = useRightClick()
    // const [display, setDisplay] = useState(true)
    // useEffect(() => {
    //     setDisplay(clicked)
    // }, [clicked])

    // const handleEnter = useCallback((e) => {
    //     if (e.key === "Enter") {
    //         setDisplay(false)
    //         PubSub.publish("onUrlCardCreated", { id: btoa(Date.now().toString()) })
    //     }
    // }, [])

    // return (
    //     display && <div
    //         onKeyDown={handleEnter}
    //         onMouseDown={(e) => { e.stopPropagation() }}
    //         style={{ top: position[1], left: position[0] }}
    //         className={cn("absolute", "bg-[#111] text-lg", "p-4", "flex flex-col gap-4")}>
    //         <p>From the web</p>
    //         <input
    //             value={url}
    //             onChange={(e) => { setUrl(e.target.value) }}
    //             type="text" className="text-black px-2" />
    //     </div>

    // )

    return <div></div>
}
