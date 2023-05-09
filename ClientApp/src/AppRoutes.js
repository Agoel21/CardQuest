import Crazy8s  from "./components/Crazy8s/Crazy8s";
import Solitaire from "./components/Solitaire/Solitaire";
import { Home } from "./components/Home/Home";

const AppRoutes = [
  {
    index: true,
    element: <Home />
  },
  {
    path: '/crazy-8s',
    element: <Crazy8s />
    },
  
  {
    path: '/solitaire',
    element: <Solitaire />
  },
  
];

export default AppRoutes;
