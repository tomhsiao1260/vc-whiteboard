import { useContext, useEffect, useRef, useState } from "react"
import { cn } from "../../../utils/cn"
import { css } from "@emotion/css"
import { Slider } from "../../ui/Slider"
import AppContext from "../../../context/AppContext"

export default function UrlCard({ card }) {

    const { video } = useContext(AppContext)

    const inputRef = useRef(null)
    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const [inupt, setInput] = useState("");
    const [url, setUrl] = useState("");

    const [isVisable, setIsVisable] = useState(true);

    const handleEnter = () => {
        setIsVisable(true)
    }

    const handleLeave = () => {
        if (url) {
            setIsVisable(false)
        }
    }

    const handleClose = () => {
        PubSub.publish("onUrlCardDelete", { id: card.id })
    }


    const handleFlip = () => {
        setFlip(!flip)
    }



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

    // const handleFileOnClick = async (file: File) => {
    //     const arraybuffer = await file.arrayBuffer();
    //     const blob = new Blob([arraybuffer], { type: file.name });
    //     const text = await file.text();
    //     PubSub.publish("onImgCardGenerate", {
    //         id: nanoid(),
    //         fileType: file.type,
    //         fileName: file.name,
    //         blob,
    //         text,
    //     });
    // };

    const iframeRef = useRef();

    const takeSnapshot = async function () {

        console.log(video)

        const width = iframeRef.current.getBoundingClientRect().width
        const height = iframeRef.current.getBoundingClientRect().height
        const startX = iframeRef.current.getBoundingClientRect().x;
        const startY = iframeRef.current.getBoundingClientRect().y;

        const canvas = document.createElement("canvas")
        canvas.style.position = "fixed"
        canvas.style.bottom = 0
        canvas.style.left = 0
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')


        ctx.drawImage(video, startX, startY, width, height, startY, startY, width, height)

        canvas.toBlob((blob) => {
            const blobUrl = URL.createObjectURL(blob)
            console.log(blobUrl)
            download(blobUrl)
        })
    }

    return <div
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        className={cn(
            "fixed translate-x-[-50%] translate-y-[-50%]", css(`
            top: ${card.positionScreen.y}px;
            left: ${card.positionScreen.x}px;
            width: ${card.widthScreen}px;   
            height:${card.heightScreen}px;
   
        `))}>
        <div className="flex gap-2 items-end justify-end">
            <div className="flex flex-col p-2 gap-1">
                <div style={{ opacity: isVisable ? 1 : 0 }}
                    className="flex flex-col transition-opacity duration-700 items-end">
                    <div className="flex gap-2 text-black">
                        <p className="text-white">flip</p>
                        <div className="w-32 bg-transparent flex items-center">
                            <input
                                type="checkbox"
                                name="flip"
                                checked={flip}
                                onChange={handleFlip}
                            />
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
            </div>
            <div className="flex flex-col p-2 gap-1">
                <div style={{ opacity: isVisable ? 1 : 0 }}
                    className="flex flex-col transition-opacity duration-700 items-end">
                    <div className="flex gap-2 text-black">
                        <button className="bg-[#DDD] rounded-lg p-1 hover:bg-[#FFF]" onClick={takeSnapshot}>snapshot</button>
                    </div>
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
            ref={iframeRef}
            style={{
                width: card.widthScreen - 16,
                height: card.heightScreen,
                transformOrigin: 'center',
                transform: `rotate(${rotation - 180}deg) scaleX(${flip ? -1 : 1})`,
            }}
            className="aspect-video" src={url} frameBorder="0"></iframe>
    </div>
}


function download(blobUrl) {
    const downloadLink = document.createElement('a')
    downloadLink.href = blobUrl
    downloadLink.download = 'canvas_image.png'

    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
}