data "keycloak_realm" "realm" {
  realm   = "master"
}

# import the client via (get client uuid from UI):
# terraform import keycloak_openid_client.admin-cli master/b3a1ad77-e61d-4526-8847-a2c47f0bd347
resource "keycloak_openid_client" "admin-cli" {
  realm_id  = data.keycloak_realm.realm.id
  client_id = "admin-cli"
  # explicit settings to match defaults in docker container
  access_type = "PUBLIC"
  full_scope_allowed = false
  backchannel_logout_session_required = false
  use_refresh_tokens = false

  # changes wrt. defaults
  standard_flow_enabled = true
  valid_redirect_uris = ["http://localhost:8081/*"]
}

