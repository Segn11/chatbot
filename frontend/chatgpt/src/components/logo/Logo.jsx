import { Link } from "react-router-dom"
import logo from "../../assets/5940332747446928966.jpg"

const Logo = () => {
    return (
        <div>
            <Link to={"/"} className="flex gap-x-2 items-center ">
                <img src={logo} className="w-10" />
                <span>Chatgpt</span>
            </Link>
        </div>
    )
}

export default Logo