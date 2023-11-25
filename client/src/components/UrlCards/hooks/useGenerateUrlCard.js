import { useEffect } from "react"
import useRightClick from "../../../hooks/useRightClick"
import PubSub from "pubsub-js"
import { nanoid } from "nanoid"

const useGenerateUrlCard = () => {
    const { clicked, position } = useRightClick()

    useEffect(() => {
        if (clicked) {
            PubSub.publish("onUrlCardGenerated", { id: nanoid(), x: position[0], y: position[1], width: 800 ,height: 900})
        }
    }, [clicked, position])

}

export default useGenerateUrlCard