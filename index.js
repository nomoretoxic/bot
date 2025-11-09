const { Client, GatewayIntentBits } = require("discord.js");
const express = require('express');

// ====== EXPRESS ======
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

// ====== DISCORD BOT ======
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

// ====== CONFIG ======
const TOKEN = process.env.TOKEN; 
const WELCOME_CHANNEL_ID = "1436988512594296873";
const LEAVE_CHANNEL_ID = "1436988512594296873";

// ====== EVENTS ======
client.on("guildMemberRemove", member => {
  const channel = member.guild.channels.cache.get(LEAVE_CHANNEL_ID);
  if (!channel) return console.error("❌ Goodbye channel not found!");
  channel.send(`😢 **${member.user.tag}** has left **NETHERVERSE SMP**. We’ll miss you! 👋`);
});

// ====== LOGIN ======
client.login(TOKEN);

