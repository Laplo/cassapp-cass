import React from 'react';
import {useKeycloak} from "@react-keycloak/web";
import {ApolloClient, ApolloProvider, HttpLink, InMemoryCache, split} from "@apollo/client";
import {WebSocketLink} from "@apollo/client/link/ws";
import {getMainDefinition} from "@apollo/client/utilities";
import Bar from "./Bar";

function App() {
    const { initialized, keycloak } = useKeycloak();

    const headers = {
        Authorization: `Bearer ${keycloak.token}`
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

    console.log(initialized ? keycloak.tokenParsed.sub : initialized)

    return initialized ?
        <ApolloProvider client={client}>
            <div className="App">
                <Bar userId={keycloak.tokenParsed.sub}/>
            </div>
        </ApolloProvider>
        : <span>err</span>;
}

export default App;
