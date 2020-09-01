import Keycloak from 'keycloak-js';

export const keycloak = new Keycloak({
    clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID,
    realm: process.env.REACT_APP_KEYCLOAK_REALM,
    url: process.env.REACT_APP_KEYCLOAK_URL
});

export const keycloakProviderInitConfig = {
    onLoad: 'login-required',
    promiseType: 'native'
};

export default keycloak;
