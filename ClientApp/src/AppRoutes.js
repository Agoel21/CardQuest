import { Crazy8s } from "./components/Crazy8s";
// import { FetchData } from "./components/FetchData";
import { Home } from "./components/Home";

const AppRoutes = [
  {
    index: true,
    element: <Home />
  },
  {
    path: '/counter',
    element: <Crazy8s />
    },
  /*
  {
    path: '/fetch-data',
    element: <FetchData />
  }
  */
];

export default AppRoutes;
