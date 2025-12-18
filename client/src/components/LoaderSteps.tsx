import {CircleIcon, ScanLineIcon,SquareIcon, TriangleIcon } from "lucide-react"
import { useEffect, useState } from "react"

const steps = [
    {icon: ScanLineIcon, label: "Analyzing  your request..."},
    {icon: SquareIcon, label: "Generating  layout structure..."},
    {icon: TriangleIcon, label: "Assemblig UI components.."},
    {icon: CircleIcon, label: "Finalizing  your website..."},
]
const STEP_DURATION = 45000

const LoaderSteps = () => {
    const [current, setCurrent] = useState(0)

    useEffect(()=>{
        const interval = setInterval(()=>{
            setCurrent((s)=> (s + 1) % steps.length)
        }, STEP_DURATION);
        return () => clearInterval(interval)
    },[])

    const Icon = steps[current].icon;

    return (
        <div className="w-full h-full flex flex-col items-center justufy-center bg-gray-950 relative overflow-hidden text-white">
            <div className="absolute inset-0 bg-liner-to-br from-blue"></div>
            <div className="relative z-10 w-32 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-indigo-400 animate-ping ocapity-30"/>
                <div className="absolute inset-4 rounded-full border border-purple-400/20"/>
                <Icon className="w-8 h-8 text-white opacity-80 animate-bounce"/>
            </div>
            {/* step label - fade using transition only (no invisible start) */}
            <p key={current} className="mt-8 text-lg font">{steps[current].label}</p>
            <p>This may take around 2-3 minutes..</p>
        </div>
    )
}
export default LoaderSteps