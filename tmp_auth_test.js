const BASE = "https://mbaara-backend.vercel.app";
const email = `test+prod-${Date.now()}@example.com`;
const password = "TestProd!234";
const headers = {"Content-Type": "application/json"};
(async () => {
  try {
    const register = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email, password, full_name: "Test Prod" }),
    });
    const registerBody = await register.text();
    console.log("register", register.status, registerBody);

    const login = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email, password }),
    });
    const loginBody = await login.text();
    console.log("login", login.status, loginBody);

    if (login.ok) {
      const token = JSON.parse(loginBody).access_token;
      const me = await fetch(`${BASE}/api/auth/me`, {
        method: "GET",
        headers: { Authorization: "Bearer " + token },
      });
      console.log("me", me.status, await me.text());
    }
  } catch (err) {
    console.error("error", err);
  }
})();
