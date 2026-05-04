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
  const agentId = req.params.agentId;
  const voiceGrant = new VoiceGrant({
    incomingAllow: true
  });
  const token = new AccessToken(
    process.env.ACCOUNT_SID,
    process.env.API_KEY_SID,
    process.env.API_KEY_SECRET,
    { identity: agentId }
  );
  token.addGrant(voiceGrant);
  res.json({
    token: token.toJwt()
  });
});
app.post("/voice", (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();
  const agent = agents.find(a => a.available);
  if (agent) {
    agent.available = false; 
    const dial = twiml.dial();
    dial.client(agent.id);
  } else {
    twiml.say("All agents are busy. Please wait.");
  }
  res.type("text/xml");
  res.send(twiml.toString());
});
app.post("/call-status", (req, res) => {
  const agentId = req.body.To; 
  const agent = agents.find(a => a.id === agentId);
  if (agent) agent.available = true;
  res.sendStatus(200);
});
app.use(express.static("public"));
app.listen(3000, () => {
  console.log("Call Center running on http://localhost:3000");
});