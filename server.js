const express = require("express");
const twilio = require("twilio");
require("dotenv").config();
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
let agents = [
  { id: "agent-1", available: true },
  { id: "agent-2", available: true }
];
app.get("/token/:agentId", (req, res) => {
  const AccessToken = twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;
  const token = new AccessToken(
    process.env.ACCOUNT_SID,
    process.env.API_KEY_SID,
    process.env.API_KEY_SECRET,
    { identity: req.params.agentId }
  );
  token.addGrant(
    new VoiceGrant({
      outgoingApplicationSid: process.env.TWIML_APP_SID,
      incomingAllow: true
    })
  );
  res.json({ token: token.toJwt() });
});
app.post("/voice", (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();
  const agent = agents.find(a => a.available);
  if (agent) {
    console.log("Routing call to:", agent.id);
    agent.available = false;
    const dial = twiml.dial({
      action: "/call-status",
      method: "POST"
    });
    dial.client(agent.id);
  } else {
    console.log("All agents busy");
    twiml.say("All agents are busy. Please try again later.");
  }
  res.type("text/xml");
  res.send(twiml.toString());
});
app.post("/call-status", (req, res) => {
  console.log("Call ended:", req.body);
  const agentId = req.body.To;
  const agent = agents.find(a => a.id === agentId);
  if (agent) {
    agent.available = true;
    console.log(agentId, "is now available");
  }
  res.sendStatus(200);
});
app.use(express.static("public"));
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});