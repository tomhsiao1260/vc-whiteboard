import { AiOutlineGithub } from "react-icons/ai"
import { cn } from '../../utils/cn'

export default function Social() {
    return (
        <div className={cn('fixed bottom-0 right-0', "text-3xl", "p-3")}>
            <a href='https://github.com/tomhsiao1260/volume-viewer' target="_blank" className="cursor-pointer opacity-75 hover:opacity-100" rel="noreferrer">
                <AiOutlineGithub />
            </a>
        </div>
    )
}
