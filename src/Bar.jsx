import {useQuery, gql, HttpLink, split, ApolloClient, InMemoryCache, ApolloProvider} from "@apollo/client";
import Homepage from "./Homepage";
import React, {useContext} from "react";
import {WebSocketLink} from "@apollo/client/link/ws";
import {getMainDefinition} from "@apollo/client/utilities";
import BarContext from "./BarContext";

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
    const {data, loading, error} = useQuery(QUERY_BAR, { variables : { barConnectionId: barConnectionId }});

    return loading ?
        <p>Chargement...</p>
        : (
            data && data.bars.length ?
                <Homepage barId={data.bars[0].bar_id} />
                : (
                    error ?
                        <p>Une erreur est survenue...</p>
                        : <p>Aucun bar trouvé...</p>
                )
        );
}
