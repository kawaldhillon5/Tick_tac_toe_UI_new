import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GameProvider } from './contexts/gameContext'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Home } from './routes/Home';
import { Game } from './routes/Game';
import Root from './routes/Root';

const router = createBrowserRouter([
  {
    path: "/",
    element: <GameProvider><Root/></GameProvider>,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "game/:gameId", 
        element: <Game />,
      },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
