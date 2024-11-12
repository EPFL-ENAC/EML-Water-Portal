from enacit4r_auth.services.auth import KeycloakService, User
from api.config import config

kc_service = KeycloakService(config.KEYCLOAK_URL, config.KEYCLOAK_REALM,
                             config.KEYCLOAK_API_ID, config.KEYCLOAK_API_SECRET, "water-portal-admin")
