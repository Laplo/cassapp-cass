import React from 'react';
import {useKeycloak} from "@react-keycloak/web";
import {ApolloClient, ApolloProvider, HttpLink, InMemoryCache, split} from "@apollo/client";
import {WebSocketLink} from "@apollo/client/link/ws";
import {getMainDefinition} from "@apollo/client/utilities";
import Bar from "./Bar";
import BarContext from "./BarContext";
import LinearProgress from "@bit/mui-org.material-ui.linear-progress";
import './LinearProgress.css';

function ApolloProvide({barId, token}) {

    const headers = {
        Authorization: `Bearer ${token}`,
        'X-Hasura-User-Id': barId
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
            <BarContext.Provider value={{barId}}>
                <div className="App">
                    <Bar />
                </div>
            </BarContext.Provider>
        </ApolloProvider>
    );
}

function App() {
    const { initialized, keycloak } = useKeycloak();

    return initialized ?
        <ApolloProvide barId={keycloak.tokenParsed.sub} token={keycloak.token}/>
        : <LinearProgress className="linearProgress" />;
}

export default App;
