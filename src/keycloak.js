import Keycloak from 'keycloak-js';

export const keycloak = new Keycloak({
    clientId: process.env.KEYCLOAK_CLIENT_ID,
    realm: process.env.KEYCLOAK_REALM,
    url: process.env.KEYCLOAK_URL
});

export const keycloakProviderInitConfig = {
    onLoad: 'login-required',
    promiseType: 'native'
};

export default keycloak;
