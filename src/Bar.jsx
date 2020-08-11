import Homepage from "./Homepage";
import React, {useEffect, useState} from "react";
import Dashboard from "./Dashboard";


import {BrowserRouter as Router, Link, Route, Switch, useLocation} from "react-router-dom";

export default function Bar({ barId }) {
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
                <Route path="/dashboard">
                    <Dashboard barId={barId} />
                </Route>
                <Route path="/">
                    <Homepage barId={barId} />
                </Route>
            </Switch>
        </Router>
    );
}


function DynamicLink() {
    const location = useLocation();
    const [ link, setLink ] = useState({
        pathname: (location.pathname === '/' ? '/dashboard' : '/') ,
        name: location.pathname === '/' ? 'Panneau d\'administration' : 'Commandes'
    });

    useEffect(() => {
        setLink(l => ({
            pathname: (location.pathname === '/' ? '/dashboard' : '/'),
            name: location.pathname === '/' ? 'Panneau d\'administration' : 'Commandes'
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
