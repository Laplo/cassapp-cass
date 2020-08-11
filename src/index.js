import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './assets/main.css'
import * as serviceWorker from './serviceWorker';

import {KeycloakProvider} from "@react-keycloak/web";
import {keycloak, keycloakProviderInitConfig} from "./keycloak";

require('dotenv').config();

ReactDOM.render(
  <React.StrictMode>
      <KeycloakProvider
          keycloak={keycloak}
          initConfig={keycloakProviderInitConfig}
      >
        <App />
      </KeycloakProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register();
