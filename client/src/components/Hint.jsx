import React, { useState, useEffect } from 'react'
import { cn } from '../utils/cn'

export default function Hint() {

    const [show, setShow] = useState(true);

    useEffect(() => {

        const cb = (e) => {

            setShow(false)

        }
        window.addEventListener("mousedown", cb)

        return () => {
            window.removeEventListener("mousedown", cb)
        }
    }, []);

    return (
        show ? <div className={cn('fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]', "bg-[#111] opacity-80", "p-4", "text-lg")}>
            <p>Press <u>Enter</u> + <u>Click</u> to
                Generate a Card</p>
        </div> : <></>
    )
}
