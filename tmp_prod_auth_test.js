(async () => {
  const BASE = "https://mbaara-backend.vercel.app";
  const headers = { 'Content-Type': 'application/json' };
  try {
    const register = await fetch(${BASE}/api/auth/register, {
      method: 'POST', headers, body: JSON.stringify({ email: 'test+prod-20260811133307@example.com', password: 'TestProd!234', full_name: 'Test Prod' })
    });
    const registerBody = await register.text();
    console.log('REGISTER', register.status, registerBody);

    const login = await fetch(${BASE}/api/auth/login, {
      method: 'POST', headers, body: JSON.stringify({ email: 'test+prod-20260811133307@example.com', password: 'TestProd!234' })
    });
    const loginBody = await login.text();
    console.log('LOGIN', login.status, loginBody);

    if (login.ok) {
      const token = JSON.parse(loginBody).access_token;
      const me = await fetch(${BASE}/api/auth/me, {
        method: 'GET', headers: { Authorization: 'Bearer ' + token }
      });
      console.log('ME', me.status, await me.text());
    }
  } catch (err) {
    console.error('ERROR', err);
  }
})();
