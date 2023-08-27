import React, { useEffect, useState } from 'react'

/**
 * * this is the index.js file of Volume Viewer Core
 * * ===============================================
 * * It will load when the App component is mounted.
 * * 
 * * - useEffect(()=>{ volumeViewer();}, [])
 * * 
 */

import GUI from './components/GUI';
import CardComponent from './components/Card';
import useVolumeViewer from './hooks/useVolumeViewer';
import Card from "./core/Card.js"
import useCardData from './hooks/useCardData';

export default function App() {

    // cardInstance.list
    const [dummyData, setDummyData] = useState([] /** api to get cardInstances' List */);

    useVolumeViewer();

    // useCardData();


    return (
        <div className="relative">
            <GUI />
            {dummyData.map(card =>
                < CardComponent card={card} />
            )}
            <canvas className='webgl'></canvas>
        </div>
    )
}
