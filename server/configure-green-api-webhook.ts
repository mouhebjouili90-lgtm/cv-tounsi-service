const instanceId = "710722723763";
const token = "d9c991a8253e46289476fd563844a564dace439e516546db82";
const webhookUrl = "https://www.cvtounsi.com/api/whatsapp/webhook";

async function configureWebhook() {
  const url = `https://7107.api.greenapi.com/waInstance${instanceId}/setSettings/${token}`;
  
  console.log(`Setting webhook URL to ${webhookUrl}...`);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      webhookUrl: webhookUrl,
      incomingWebhook: "yes",
      stateWebhook: "yes",
    }),
  });

  const data = await res.json();
  console.log("Configuration result:", data);
}

configureWebhook().catch(console.error);
