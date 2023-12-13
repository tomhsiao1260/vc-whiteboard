
/**
 * * this is the index.js file of Volume Viewer Core
 * * ===============================================
 * * It will load when the App component is mounted.
 * * 
 */
import Info from './components/Info/Info';
import Hint from './components/Hint/Hint';
import Social from './components/Social/Social';
import AppContext from './context/AppContext';
import FileSystem from "./components/FileSystem/FileSystem";
import useWhiteboardUpdate from "./hooks/useWhiteboardUpdate";
import useWhiteboardApp from "./hooks/useWhiteboardApp";
import UrlCards from "./components/UrlCards/UrlCards";
import Cards from "./components/Cards/Cards";
import useCardRender from "./hooks/deprecated/useCardRender";
import Version from './components/Version/Version';
import TextCards from "./components/TextCards/TextCards"
import { Analytics } from '@vercel/analytics/react';
import ScreenShot from "./components/ScreenShot/ScreenShot";
import { useEffect, useState } from "react";


export default function App() {

    // 白板本身
    const app = useWhiteboardApp();
    // 白板狀態
    const whiteboard = useWhiteboardUpdate();

    // 白板控制 (舊, 會重構)
    useCardRender(app);

    const [video, setVideo] = useState(null)

    useEffect(() => {
        const video = document.createElement("video")
        video.style.position = 'fixed'
        video.style.top = 0
        video.style.right = 0
        // video.style.visibility = 'hidden'
        video.autoplay = true
        video.muted = true
        video.playsInline = true
        video.width = window.innerWidth
        video.height = window.innerHeight
        document.body.appendChild(video)
        video.style.visibility = 'hidden'
        setVideo(video)
    }, [])


    return (
        <AppContext.Provider value={{
            app,
            whiteboard,
            video
        }}>
            <div className="relative">
                <Info />
                <FileSystem />
                <Hint>
                    {/* <Hint.HotKey hotkey={["num", "LEFT"]}>
                        {"<Generate Card>"}
                    </Hint.HotKey> */}
                    <Hint.HotKey hotkey={["RIGHT"]}>
                        {"<Generate Embedded Card>"}
                    </Hint.HotKey>
                    <Hint.HotKey hotkey={["DRAG"]}>
                        {"<Move Whiteboard>"}
                    </Hint.HotKey>
                    <Hint.HotKey hotkey={["SPACE", "DRAG"]}>
                        {"<Update Scene in Card>"}
                    </Hint.HotKey>
                    {/* <Hint.HotKey hotkey={["ALT", "/"]}>
                        {"<Open HotKey Pannel>"}
                    </Hint.HotKey> */}
                </Hint>
                {/*<About />*/}
                <Social />
                <Version />
                <ScreenShot />
                <Cards />
                <UrlCards />
                <TextCards />
                <canvas className='webgl'></canvas>
            </div>
            <Analytics />
        </AppContext.Provider>
    )
}
