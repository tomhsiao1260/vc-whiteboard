
/**
 * * this is the index.js file of Volume Viewer Core
 * * ===============================================
 * * It will load when the App component is mounted.
 * * 
 */
import React, { useEffect, useState, useRef } from 'react'

import useVolumeViewer from './hooks/useVolumeViewer';
import Info from './components/Info';
import Hint from './components/Hint/Hint';
import Social from './components/Social';
import About from './components/About';

import AppContext from './context/AppContext';
import useCardList from './hooks/useCardList';
import Card from './components/Card/Card';

export default function App() {

    const WB = useVolumeViewer();
    const cardList = useCardList(WB);

    return (
        <AppContext.Provider value={{
            WB
        }}>
            <div className="relative">
                <Info />
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
                {cardList.map(({ id }) =>
                    <Card key={id} options={{ id }} />
                )}
                <canvas className='webgl'></canvas>
            </div>
        </AppContext.Provider>

    )
}
