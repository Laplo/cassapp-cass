import Keycloak from 'keycloak-js';

export const keycloak = new Keycloak();

export const keycloakProviderInitConfig = {
    onLoad: 'login-required',
    promiseType: 'native'
};

export default keycloak;
