import { Outlet, Link, useNavigation } from "react-router-dom";
import "../styles/root.css";
import { useGameConext } from "../contexts/gameContext";

export default function Root() {
  const navigation = useNavigation();
  const {gamerId, isConnected} = useGameConext();
  return (
    <>
      {navigation.state === "loading" && <div className="loading-spinner" />}
      
      <header id="root-header">
        <Link className="header-title-section" to="/">
          <h1>Tic Tac Toe</h1>
        </Link>
        <div className={`header-user-section ${isConnected ? 'connected' : null}`}>{gamerId}</div>
      </header>

      <main id="root-content">
        <Outlet />
      </main>

    </>
  );
}