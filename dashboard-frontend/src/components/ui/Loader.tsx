import Lottie from "lottie-react"
import loadingAnimation from "../../assets/loading.json"

export default function Loader() {
    return (
        <div className="flex justify-center items-center min-h-screen animate-fadeIn">
            <div className="w-72 opacity-90">
                <Lottie animationData={loadingAnimation} loop />
            </div>
        </div>
    )
}