import React, { useEffect } from 'react'

/**
 * * this is the index.js file of Volume Viewer Core
 * * ===============================================
 * * It will load when the App component is mounted.
 * * 
 * * - useEffect(()=>{ volumeViewer();}, [])
 * * 
 */
import volumeViewer from "./core/index"

export default function App() {

    useEffect(() => {
        volumeViewer();
    }, [])

    return (
        <div>
            <canvas className='webgl'></canvas>
        </div>
    )
}
