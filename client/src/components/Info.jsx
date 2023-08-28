import React from 'react'
import { cn } from '../utils/cn'

export default function Info() {
    return (
        <div className="fixed mx-3 my-1">
            <h1 className='text-2xl font-bold'>Volume Viewer</h1>
            <h3 className={cn("text-gray-200")}>A web-based volumetric renderer for Vesuvius Challenge</h3>
        </div>
    )
}
