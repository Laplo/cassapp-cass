import React from 'react';
import {ApolloClient, ApolloProvider, HttpLink, InMemoryCache, split} from "@apollo/client";
import {getMainDefinition} from "@apollo/client/utilities";
import {WebSocketLink} from "@apollo/client/link/ws";
import Homepage from "./Homepage";

function App() {

  const headers = {
    'x-hasura-admin-secret': 'Cass2020',
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
            <Homepage />
        </div>
      </ApolloProvider>
  );
}

export default App;
