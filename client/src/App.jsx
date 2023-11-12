
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


export default function App() {

    const WB = useVolumeViewer();
    const cardList = useCardList(WB);
    const renderer = useCardRender(WB);

    // useEffect(() => {
    //     PubSub.subscribe("onFileSelect", (eventName, fileObj) => {
    //         console.log(eventName, fileObj)
    //     })
    // }, [])

    return (
        <AppContext.Provider value={{
            WB
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
                    <Hint.HotKey hotkey={["ALT", "/"]}>
                        {"<Open HotKey Pannel>"}
                    </Hint.HotKey>
                </Hint>
                {/*<About />*/}
                <Social />
                {cardList.map((card) =>
                    <Card key={card.id} options={{ card, renderer }} />
                )}
                <canvas className='webgl'></canvas>
            </div>
        </AppContext.Provider>

    )
}
