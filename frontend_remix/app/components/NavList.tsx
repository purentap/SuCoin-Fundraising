import { NavLink } from "@remix-run/react";

export type RouteNav = {
    to: string;
    text: string;
}

export function NavList({routes}: {routes: RouteNav[]}) {

  const activeClassName = "underline";
  const nonActiveClassName = "hover:text-xl";
  return (
    <nav className="flex space-x-2">

      {routes.map((route) => (


          <NavLink
          key={route.to}
            to={route.to}
            className={({ isActive }) =>
              (isActive ? activeClassName : nonActiveClassName) +  " text-gray-100 hidden lg:block"
            }
          >
            {route.text}
          </NavLink>
      
      ))}

       
    </nav>
  );
}
