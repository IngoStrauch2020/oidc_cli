# CLI script that uses OIDC auth code flow

This is an example how to open a browser from a node cli script to use the OIDC
authorization code flow.

When running the script, it starts an HTTP server listening on a local port
which gets called at the end of the auth call via the passed redirect_uri.
It then stops the HTTP server, parses the query parameters to retrieve the auth code.
With that auth code the script then calls the token endpoint to get an access_token.
At the end the script just dumps the token response body for demonstration purposes.

For easy setup, a docker compose file is provided that starts a keycloak container
to act as the identity provider.
In case you want to use your own keycloak server somewhere (or a totally
different OIDC server) or can't use the local ports 8080 and 8081, have a look
at `index.js` and adjust to your needs.

## Local setup
1. Install the required packages with your preferred tool, i.e. pick one of
    ```
   npm install
   yarn install
   pnpm install
    ```
2. Start the keycloak container with docker
    ```
    docker compose up -d
    ```
    Wait a bit until the keycloak container is up and running.
    It's ready when `docker logs -f keycloak_oidc_with_cli` shows "Running the server in development mode. DO NOT use this configuration in production."
3. Get the ID of the `admin-cli` client
   - Open http://localhost:8080 and login with "admin/admin"
   - Navigate to "Clients > admin-cli"
   - Copy the ID from the URL
     
     e.g. "b3a1ad77-e61d-4526-8847-a2c47f0bd347" when the full URL is http://localhost:8080/admin/master/console/#/master/clients/b3a1ad77-e61d-4526-8847-a2c47f0bd347/settings 
4. Initial terraform setup and import of the `admin-cli` client
    ```
   terraform init
   terraform import keycloak_openid_client.admin-cli master/b3a1ad77-e61d-4526-8847-a2c47f0bd347
    ```
5. Allow authorization code flow (standard flow in keycloak terms) and
   add allowed redirect URI to the local script callback

    ```
   terraform apply
   ```

If you don't want to use terraform for the keycloak docker container, or you want to
use your existing keycloak server, simply edit the `admin-cli` client in the
keycloak admin console.
Enable the "Standard flow" checkbox under "Capability config" and then add
"http://localhost:8081/*" in the "Valid redirect URIs" under "Access settings".

## Executing the script

Use your preferred tool to start the script, i.e. pick one of
```
npm start
yarn start
pnpm start
```

This will open a browser tab to call the auth endpoint.
If you aren't logged in already, enter "admin/admin" as credentials.
When login was successful, or you already have an active session,
the browser will then show a message that you can close the window.
Back in the terminal where you started the script you will then see a dump
of the response body of the token endpoint call.
