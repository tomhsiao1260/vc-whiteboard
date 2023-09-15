
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

export default function App() {

    const WB = useVolumeViewer();

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
                        {"<To move Screen>"}
                    </Hint.HotKey>
                    <Hint.HotKey hotkey={["SPACE", "DRAG"]}>
                        {"<To generate card>"}
                    </Hint.HotKey>
                    <Hint.HotKey hotkey={["ALT", "/"]}>
                        {"<Open HotKey Pannel>"}
                    </Hint.HotKey>
                </Hint>
                {/*<About />*/}
                <Social />
                <canvas className='webgl'></canvas>
            </div>
        </AppContext.Provider>

    )
}
