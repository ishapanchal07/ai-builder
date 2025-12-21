import { useEffect, useState } from "react"
import { useParams } from "react-router-dom";
import { dummyProjects } from "../assets/assets";
import { Loader2Icon } from "lucide-react";
import type { Project } from "../types";
import ProjectPreview from "../components/ProjectPreview";


const Preview = () => {
    //@ts-ignore
    const { projectId, versionId } = useParams()
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(true);
    const fetchCode = async () => {
        try {
         const {data} = await api.get(`/api/project/preview/${projectId}`)
        } catch (error) {
            
        }
    }

    useEffect(() => {
        fetchCode()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2Icon className='size-7 animate-spin text-indigo-200' />
            </div>
        )
    }

    return (
        <div className="h-screen">
            {code && <ProjectPreview project={{ current_code: code } as Project}
                isGenerating={false} showEditorPanel={false} />}
        </div>
    )
}

export default Preview 