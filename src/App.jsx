
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


export default function App() {

    // 白板本身
    const app = useWhiteboardApp();
    // 白板狀態
    const whiteboard = useWhiteboardUpdate();

    // 白板控制 (舊, 會重構)
    useCardRender(app);


    return (
        <AppContext.Provider value={{
            app,
            whiteboard
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
                <Cards />
                <UrlCards />
                <TextCards />
                <canvas className='webgl'></canvas>
            </div>
            <Analytics />
        </AppContext.Provider>

    )
}
