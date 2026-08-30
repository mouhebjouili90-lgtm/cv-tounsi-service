const instanceId = "710722723763";
const token = "d9c991a8253e46289476fd563844a564dace439e516546db82";

async function checkState() {
  const hosts = [
    `https://${instanceId.slice(0, 4)}.api.greenapi.com`,
    "https://api.green-api.com",
    "https://7107.api.greenapi.com",
  ];

  for (const host of hosts) {
    try {
      console.log(`Checking host: ${host}...`);
      const res = await fetch(`${host}/waInstance${instanceId}/getStateInstance/${token}`);
      const data = await res.json();
      console.log(`Result from ${host}:`, data);
      return;
    } catch (e: any) {
      console.log(`Failed host ${host}:`, e?.message);
    }
  }
}

checkState().catch(console.error);
