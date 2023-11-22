import { cn } from "../../utils/cn"

export default function UrlCardMenu(props) {

    const position = props?.position

    return (
        <div
            onMouseDown={(e) => { e.stopPropagation() }}
            style={{ top: position[1], left: position[0] }}
            className={cn("absolute", "bg-[#111] text-lg", "p-4", "flex flex-col gap-4")}>
            <p>From the web</p>
            <input type="text" className="text-black px-2" />
        </div>
    )
}
