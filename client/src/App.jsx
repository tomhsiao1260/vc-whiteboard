import React, { useEffect, useState } from 'react'

/**
 * * this is the index.js file of Volume Viewer Core
 * * ===============================================
 * * It will load when the App component is mounted.
 * * 
 * * - useEffect(()=>{ volumeViewer();}, [])
 * * 
 */
import volumeViewer from "./core/index"
import GUI from './components/GUI';
import Card from './components/Card';

export default function App() {

    // cardInstance.list
    const [dummyData, setDummyData] = useState([] /** api to get cardInstances' List */);

    useEffect(() => {
        volumeViewer();
    }, [])



    return (
        <div className="relative">
            <GUI />
            {dummyData.map(card =>
                <Card card={card} />
            )}
            <canvas className='webgl'></canvas>
        </div>
    )
}
