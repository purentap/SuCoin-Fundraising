import { NavLink } from "@remix-run/react";

export type RouteNav = {
    to: string;
    text: string;
}

export function NavList({routes}: {routes: RouteNav[]}) {
  // This styling will be applied to a <NavLink> when the
  // route that it links to is currently selected.
  const activeStyle = {
    textDecoration: "underline",
  };
  const activeClassName = "underline";
  const nonActiveClassName = "hover:text-xl";
  return (
    <nav className="flex space-x-2">

      {routes.map((route) => (


          <NavLink
            to={route.to}
            className={({ isActive }) =>
              isActive ? activeClassName : nonActiveClassName
            }
          >
            {route.text}
          </NavLink>
      
      ))}

       
    </nav>
  );
}
