import React, {useEffect, useState, lazy, Suspense} from "react";
import {BrowserRouter as Router, Link, Route, Switch, useLocation} from "react-router-dom";

const Dashboard = lazy(() => import("./Dashboard"));
const Homepage = lazy(() => import("./Homepage"));
const PrintQR = lazy(() => import("./PrintQR"));

export default function Bar() {

    const renderLoader = () => <p>Chargement des données...</p>;

    return (
        <Router>
            <div>
                <nav>
                    <ul>
                        <li>
                            <DynamicLink />
                        </li>
                    </ul>
                </nav>
            </div>
            <Switch>
                <Suspense fallback={renderLoader()}>
                    <Route exact path="/dashboard">
                        <Dashboard />
                    </Route>
                    <Route exact path="/:tableId">
                        <PrintQR />
                    </Route>
                    <Route exact path="/">
                        <Homepage />
                    </Route>
                </Suspense>
            </Switch>
        </Router>
    );
}


function DynamicLink() {
    const location = useLocation();
    const [ link, setLink ] = useState({
        pathname: (location.pathname === '/dashboard' ? '/' : '/dashboard') ,
        name: location.pathname === '/dashboard' ? 'Commandes' : 'Panneau d\'administration'
    });

    useEffect(() => {
        setLink(l => ({
            pathname: (location.pathname === '/dashboard' ? '/' : '/dashboard') ,
            name: location.pathname === '/dashboard' ? 'Commandes' : 'Panneau d\'administration'
        }));
    }, [location]);

    return (
        <Link to={link.pathname}>
            <div className="flex justify-center">
                <div
                    className="
                            inline-block
                            bg-gray-200
                            rounded-full
                            px-3
                            py-1
                            text-sm
                            font-semibold
                            text-gray-700
                            w-1/2
                            flex justify-center
                            mt-5
                        "
                >
                    {link.name}
                </div>
            </div>
        </Link>
    );
}
