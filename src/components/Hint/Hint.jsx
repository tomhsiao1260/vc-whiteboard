import { useState, useEffect } from 'react'
import { cn } from '../../utils/cn'

export default function Hint(props) {

    const [show, setShow] = useState(true);

    useEffect(() => {
        // disable
        const handleDisable = () => {
            setShow(false)
        }
        window.addEventListener("mousedown", handleDisable)

        return () => {
            window.removeEventListener("mousedown", handleDisable)
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
        "flex flex-col gap-8")
}

Hint.HotKey = function HotKey(props) {
    return (
        <li className={hintHotKeyStyles.hintHotKey} >
            <div className='flex gap-2 text-base'>
                { /*eslint-disable-next-line react/prop-types*/}
                {props.hotkey.map((h, i) =>
                    <span key={h}>
                        { /*eslint-disable-next-line react/prop-types*/}
                        <u>{h}</u>{i !== props.hotkey.length - 1 ? " +" : ""}
                    </span>
                )}
            </div>
            { /*eslint-disable-next-line react/prop-types*/}
            <span>{props.children}</span>
        </li >
    )

}

const hintHotKeyStyles = {
    hintHotKey: cn('flex w-[450px] justify-between')
}