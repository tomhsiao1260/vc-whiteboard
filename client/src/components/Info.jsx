import React from 'react'
import { cn } from '../utils/cn'

export default function Info() {
    return (
        <div className="fixed mx-3 my-1">
            <h1 className='text-2xl font-bold'>VC Whiteboard</h1>
            <h3 className={cn("text-gray-200")}>Make sense of complex topics in Vesuvius Challenge</h3>
        </div>
    )
}

