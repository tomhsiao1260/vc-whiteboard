import { useEffect, useState } from "react"
import PubSub from "pubsub-js"

const useWhiteboardUpdate = () => {

    const [whiteboard, setWhiteboard] = useState(null)

    useEffect(() => {
        PubSub.subscribe("onWhiteboardUpdate", (eventName, whiteboard) => {
            setWhiteboard(whiteboard)
        })
    }, [])

    return whiteboard

}

export default useWhiteboardUpdate