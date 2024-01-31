import axios from "axios";
import * as crypto from "crypto";
import Http from "http";
import Opener from "opener";

// this is just here when using the script against dev servers that have a self-signed certificate
// default setup with docker in this repo isn't using HTTPS anyway
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

//// Adjust below for your local needs
// the local port this script will listen for the call to the redirect uri
const localCallbackPort = 8081;
// base URL of the keycloak server to be used
const baseUrl = "http://localhost:8080";
// keycloak realm to auth against
const realm = "master";

//// you typically don't need to change these
const redirectUri = `http://localhost:${localCallbackPort}/redirect_uri`
const clientId = "admin-cli"
// in case you want to try OIDC with something other than keycloak, delete baseUrl and realm above and just set these endpoints
const authEndpoint= `${baseUrl}/realms/${realm}/protocol/openid-connect/auth`
const tokenEndpoint= `${baseUrl}/realms/${realm}/protocol/openid-connect/token`

const generateRandomString = () => crypto.randomBytes(10).toString("hex")

const buildAuthUrl = (state, nonce) => `${authEndpoint}?response_type=code&client_id=${clientId}&scope=openid&redirect_uri=${redirectUri}&state=${state}&nonce=${nonce}`

const exchangeCodeForToken = async (calledRedirectUriWithParams, expectedState) => {
  const params = new URLSearchParams(calledRedirectUriWithParams.replace("/redirect_uri?", ""))

  if (! params.has("code")) {
    console.log(calledRedirectUriWithParams)
    throw new Error("Redirect URL was called but did not contain an authorization code")
  }
  if (! params.get("state") === expectedState) {
    console.log("Expected state:", expectedState)
    console.log("Returned state:", params.get("state"))
    throw new Error("Something went wrong, we did not get the expected state back")
  }

  const data = {
    "grant_type": "authorization_code",
    "client_id": clientId,
    "code": params.get("code"),
    "redirect_uri": redirectUri
  };
  return axios.post(tokenEndpoint, data,
    {headers: {"content-type": "application/x-www-form-urlencoded"}
    })
    .then(response => response.data)
    .catch(error => {
      console.log(error);
    });
}

const loginViaAuthCodeFlow = async () => {
  const state = generateRandomString();
  const nonce = generateRandomString();
  const authUrlWithParams = buildAuthUrl(state, nonce);

  return new Promise((resolve, reject) => {

    let server = null;
    const callback = async (request, response) => {

      if (server != null) {

        response.write("Callback method has been called. You can close this window now.");
        response.end();
        server.close();
        server = null;

        try {
          const accessToken = await exchangeCodeForToken(request.url, state);
          resolve(accessToken);
        } catch (e) {
          reject(e);
        }
      }
    }

    server = Http.createServer(callback);
    server.listen(localCallbackPort);

    Opener(authUrlWithParams);
  });
};

const tokenResponse = await loginViaAuthCodeFlow()
console.log("Token response:")
console.log(tokenResponse)
