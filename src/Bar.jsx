import {useQuery, gql, HttpLink, split, ApolloClient, InMemoryCache, ApolloProvider} from "@apollo/client";
import Homepage from "./Homepage";
import React, {useContext, useEffect, useState} from "react";
import {WebSocketLink} from "@apollo/client/link/ws";
import {getMainDefinition} from "@apollo/client/utilities";
import BarContext from "./BarContext";
import Dashboard from "./Dashboard";

import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link,
    useLocation
} from "react-router-dom";

const QUERY_BAR = gql`
    query MyQuery($barConnectionId: uuid!) {
      bars(where: {bar_connection_id: {_eq: $barConnectionId}}) {
        bar_id
      }
    }
`;

export default function Provide() {
    const headers = {
        'x-hasura-admin-secret': process.env.REACT_APP_APOLLO_ADMIN_KEY,
    };
    const httpLink = new HttpLink({
        uri: 'http' + process.env.REACT_APP_APOLLO_URL,
        headers,
    });
    const wsLink = new WebSocketLink({
        uri: 'ws' + process.env.REACT_APP_APOLLO_URL,
        options: {
            reconnect: true,
            connectionParams: {
                headers,
            },
        },
    });
    const link = split(
        ({query}) => {
            const definition = getMainDefinition(query);
            return (
                definition.kind === 'OperationDefinition' &&
                definition.operation === 'subscription'
            );
        },
        wsLink,
        httpLink,
    );
    const client = new ApolloClient({
        link,
        cache: new InMemoryCache(),
    });

    return (
        <ApolloProvider client={client}>
            <div className="App">
                <Bar />
            </div>
        </ApolloProvider>
    );

}

function Bar() {
    const { barConnectionId } = useContext(BarContext);
    const { data, loading, error } = useQuery(QUERY_BAR, { variables : { barConnectionId: barConnectionId }});

    return loading ?
        <p>Chargement...</p>
        : (
            data && data.bars.length ?
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
                            <Dashboard barId={data.bars[0].bar_id} />
                        </Route>
                        <Route path="/">
                            <Homepage barId={data.bars[0].bar_id} />
                        </Route>
                    </Switch>
                </Router>
                : (
                    error ?
                        <p>Une erreur est survenue...</p>
                        : <p>Aucun bar trouvé...</p>
                )
        );
}


function DynamicLink() {
    const { barConnectionId } = useContext(BarContext);
    const location = useLocation();
    const [ link, setLink ] = useState({
        pathname: (location.pathname === '/' ? '/dashboard?b=' : '/?b=') + barConnectionId,
        name: location.pathname === '/' ? 'Panneau d\'administration' : 'Commandes'
    });

    useEffect(() => {
        setLink(l => ({
            pathname: (location.pathname === '/' ? '/dashboard?b=' : '/?b=') + barConnectionId,
            name: location.pathname === '/' ? 'Panneau d\'administration' : 'Commandes'
        }));
    }, [location, barConnectionId]);

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
