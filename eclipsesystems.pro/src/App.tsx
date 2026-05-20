import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Shell } from "@ui/components/Shell";
import { HomeRoute } from "@ui/routes/HomeRoute";
import { NotFoundRoute, StaticRoute } from "@ui/routes/StaticRoute";
import { ContactRoute } from "@ui/routes/ContactRoute";

const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { path: "/", element: <HomeRoute /> },
      { path: "/pricing", element: <StaticRoute title="Pricing" /> },
      { path: "/features", element: <StaticRoute title="Features" /> },
      { path: "/features/:slug", element: <StaticRoute title="Feature" /> },
      { path: "/contact", element: <ContactRoute /> },
      { path: "/industries", element: <StaticRoute title="Industries" /> },
      { path: "/industries/:industry", element: <StaticRoute title="Industry" /> },
      { path: "/locations", element: <StaticRoute title="Locations" /> },
      { path: "/locations/:city", element: <StaticRoute title="Location" /> },
      { path: "/utbms", element: <StaticRoute title="UTBMS" /> },
      { path: "/utbms/:code", element: <StaticRoute title="UTBMS Code" /> },
      { path: "/glossary", element: <StaticRoute title="Glossary" /> },
      { path: "/glossary/:term", element: <StaticRoute title="Glossary Term" /> },
      { path: "/blog", element: <StaticRoute title="Blog" /> },
      { path: "/guides", element: <StaticRoute title="Guides" /> },
      { path: "/plans/:plan", element: <StaticRoute title="Plan" /> },
      { path: "/vs/:competitor", element: <StaticRoute title="Comparison" /> },
      { path: "/alternatives/:competitor", element: <StaticRoute title="Alternative" /> },
      { path: "*", element: <NotFoundRoute /> }
    ]
  }
]);

export default function App() {
  return <RouterProvider router={router} />;
}
