import React, { useState, useEffect } from 'react'
import { cn } from '../../utils/cn'

export default function Hint(props) {

    const [show, setShow] = useState(true);

    useEffect(() => {

        const cb1 = (evt) => {
            if (evt.altKey) {
                if (evt.key === "/") {
                    setShow(true)
                }

            }
        }
        // alt + /
        window.addEventListener("keydown", cb1)

        // disable
        const cb2 = (e) => {
            setShow(false)
        }
        window.addEventListener("mousedown", cb2)

        return () => {
            window.removeEventListener("keydown", cb1)
            window.removeEventListener("mousedown", cb2)
        }
    }, [show]);

    return (
        show ?
            <div className={cn(hintStyles.hint)}>
                <div>
                    <h4 className='text-2xl'>Hot Key</h4>
                </div>
                <ul className='flex flex-col gap-2'>
                    {props.children}
                </ul>
            </div> : <></>
    )
}

const hintStyles = {
    hint: cn(
        'fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]',
        "bg-[#111] opacity-80",
        "p-8",
        "flex flex-col gap-8",
        "text-lg")
}

Hint.HotKey = (props) => {
    return (
        <li className={hintHotKeyStyles.hintHotKey} >
            <span>
                {props.hotkey.map((h, i) =>
                    <div key={h}>
                        <u>{h}</u>{i !== props.hotkey.length - 1 ? " + " : ""}
                    </div>
                )}
            </span>
            <span>{props.children}</span>
        </li >
    )
}

const hintHotKeyStyles = {
    hintHotKey: cn('flex w-[450px] justify-between')
}