
/**
 * * this is the index.js file of Volume Viewer Core
 * * ===============================================
 * * It will load when the App component is mounted.
 * * 
 */
import useVolumeViewer from './hooks/useVolumeViewer';
import Info from './components/Info/Info';
import Hint from './components/Hint/Hint';
import Social from './components/Social/Social';

import AppContext from './context/AppContext';
import useCardList from './hooks/useCardList';
import Card from './components/Card/Card';
import useCardRender from './hooks/useCardRender';
import FileSystem from "./components/FileSystem/FileSystem";
import useUrlCardList from "./hooks/useUrlCardList";
import useRightClick from "./hooks/useRightClick";
import UrlCardMenu from "./components/UrlCard/UrlCard.jsx";
import UrlCard from "./components/UrlCard/UrlCard.jsx";
import { useEffect } from "react";
import PubSub from "pubsub-js";
import { nanoid } from "nanoid";

export default function App() {

    // 白板本身
    const whiteboard = useVolumeViewer();
    // 版本狀態 (即時更新)
    const renderer = useCardRender(whiteboard);

    // 卡片列表
    const cardList = useCardList(whiteboard);
    const urlCardList = useUrlCardList(whiteboard)

    // useEffect(() => {
    // PubSub.subscribe("onFileSelect", (eventName, fileObj) => {
    //     console.log(eventName, fileObj)
    // })
    // }, [])

    const { clicked, position } = useRightClick()

    useEffect(() => {
        if (clicked) {
            PubSub.publish("onUrlCardGenerated", { id: nanoid(), x: position[0], y: position[1], width: 40, height: 80 })
        }
    }, [clicked, position])

    return (
        <AppContext.Provider value={{
            whiteboard
        }}>
            <div className="relative">
                <Info />
                <FileSystem />
                <Hint>
                    <Hint.HotKey hotkey={["num", "LEFT"]}>
                        {"<To generate Card>"}
                    </Hint.HotKey>
                    <Hint.HotKey hotkey={["DRAG"]}>
                        {"<To move Whiteboard>"}
                    </Hint.HotKey>
                    <Hint.HotKey hotkey={["SPACE", "DRAG"]}>
                        {"<To update scene in Card>"}
                    </Hint.HotKey>
                    {/* <Hint.HotKey hotkey={["ALT", "/"]}>
                        {"<Open HotKey Pannel>"}
                    </Hint.HotKey> */}
                </Hint>
                {/*<About />*/}
                <Social />
                {/* Card */}
                {cardList.map((card) =>
                    <Card key={card.id} options={{ card, renderer }} />
                )}
                {/* Card (url) */}
                {/* {urlCardList.map((card) =>
                    <UrlCard key={card.id} options={{ card, renderer }} />
                )} */}
                <canvas className='webgl'></canvas>
            </div>
        </AppContext.Provider>

    )
}
