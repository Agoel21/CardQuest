import React from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import './styles/global.css';
import { AppShell } from './ui/AppShell';
import { Home } from './routes/Home';
import { KlondikeScreen } from './routes/KlondikeScreen';
import { Crazy8sScreen } from './routes/Crazy8sScreen';
import { FreeCellScreen } from './routes/FreeCellScreen';
import { HeartsScreen } from './routes/HeartsScreen';
import { MultiplayerScreen } from './routes/MultiplayerScreen';

/**
 * Hash routing, deliberately: the site is served from GitHub Pages, which has
 * no server-side rewrite, so a deep link under browser routing would 404 on
 * refresh.
 */
const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Home /> },
      { path: 'klondike', element: <KlondikeScreen /> },
      { path: 'crazy-8s', element: <Crazy8sScreen /> },
      { path: 'freecell', element: <FreeCellScreen /> },
      { path: 'hearts', element: <HeartsScreen /> },
      { path: 'play-a-friend', element: <MultiplayerScreen /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
