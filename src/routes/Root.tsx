import { Outlet, Link, useNavigation } from "react-router-dom";

export default function Root() {
  const navigation = useNavigation();

  return (
    <div className="app-container">
      {navigation.state === "loading" && <div className="loading-spinner" />}
      
      <header id="root-header">
        <Link to="/">
          <h1>Tic Tac Toe</h1>
        </Link>
        <nav>
          <Link to="/about">About</Link>
        </nav>
      </header>

      <main id="root-content">
        <Outlet />
      </main>

      <footer id="root-footer">
        <p>----</p>
      </footer>
    </div>
  );
}