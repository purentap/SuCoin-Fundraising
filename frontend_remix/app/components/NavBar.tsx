import { NavLink } from "@remix-run/react";
import {RouteNav,NavList} from "./NavList";
import {ChevronDownIcon} from "@heroicons/react/20/solid";
export default function NavBar() {

    const routes: RouteNav[] = [
        {to: "/", text: "Home"},
        {to: "projects", text: "Projects"},
        {to: "auctions", text: "Auctions"},
        {to: "swap", text: "Swap"},
        {to: "apply", text: "Apply"},
    ]

    return (
        <div className="flex space-x-10 items-center  bg-blue-300 px-32">
            <p className="text-xl text-white font-semibold">SULaunch</p>
           <NavList routes={routes}/>
           <div className="flex justify-end flex-grow">
            <ChevronDownIcon className="cursor-pointer" height={20} width={20}/>
           </div>
        </div>
    );
    }