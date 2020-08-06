import React from 'react';
import logo from './logo.svg';
import {ApolloClient, ApolloProvider, HttpLink, InMemoryCache} from "@apollo/client";

function App() {

  const headers = {
    'x-hasura-admin-secret': process.env.REACT_APP_APOLLO_ADMIN_KEY
  };
  const httpLink = new HttpLink({
    uri: process.env.REACT_APP_APOLLO_URL,
    headers
  });
  const client = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache()
  });


  return (
      <ApolloProvider client={client}>
        <div className="App">
        </div>
      </ApolloProvider>
  );
}

export default App;
