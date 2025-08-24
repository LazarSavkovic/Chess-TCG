import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* ensure it’s on top visually */}
      <div className="sticky top-0 z-50">
        <NavBar />
      </div>
      <Outlet />
    </div>
  );
}
