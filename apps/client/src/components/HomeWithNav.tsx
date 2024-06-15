import { faImage } from "@fortawesome/free-regular-svg-icons";
import { faInfo, faLock, faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

export default function HomeWithNav() {
  const location = useLocation();

  const getLinkStyle = useCallback(
    (path: string) => {
      const baseStyle =
        "flex flex-col flex-grow items-center justify-center py-2 gap-1 text-sm font-space font-bold ";
      return location.pathname === path
        ? baseStyle + "bg-white bg-opacity-[.2]"
        : baseStyle;
    },
    [location],
  );

  return (
    <div className="h-content w-screen flex flex-col">
      <Outlet />
      <nav
        className="flex flex-row items-center justify-center text-white bg-dark"
        style={{ height: 54 }}
      >
        <Link className={getLinkStyle("/")} to="/">
          <FontAwesomeIcon icon={faImage} />
          <p>My Map</p>
        </Link>
        <div className="w-[1px] h-full bg-dark" />
        <Link className={getLinkStyle("/leaderboard")} to="/leaderboard">
          <FontAwesomeIcon icon={faUsers} />
          <p>Leaderboard</p>
        </Link>
        <div className="w-[1px] h-full bg-dark" />
        <Link className={getLinkStyle("/zupass")} to="/zupass">
          <FontAwesomeIcon icon={faLock} />
          <p>Zupass</p>
        </Link>
        <div className="w-[1px] h-full bg-dark" />
        <Link className={getLinkStyle("/about")} to="/about">
          <FontAwesomeIcon icon={faInfo} />
          <p>About</p>
        </Link>
      </nav>
    </div>
  );
}
