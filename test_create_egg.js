const http = require('http');

const payload = JSON.stringify({
  name: "Test Egg",
  category: "test",
  icon: "/test.png",
  pterodactylEggId: 1,
  pterodactylNestId: 1,
  description: "test egg",
  env: [],
  allowedPlans: ["plan_id_1"]
});

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/admin/eggs',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test'
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log(res.statusCode, body));
});
req.write(payload);
req.end();
