import React, { useEffect, useState, useRef } from 'react'

/**
 * * this is the index.js file of Volume Viewer Core
 * * ===============================================
 * * It will load when the App component is mounted.
 * * 
 */

import useVolumeViewer from './hooks/useVolumeViewer';
import Info from './components/Info';
import Hint from './components/Hint';
import Social from './components/Social';
import About from './components/About';

export default function App() {

    useVolumeViewer();

    return (
        <div className="relative">
            <Info />
            <Hint />
            <About />
            <Social />
            <canvas className='webgl'></canvas>
        </div>
    )
}
