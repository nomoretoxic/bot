// index.js
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    const port = process.env.PORT || 2000
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

// ====== CONFIG ======
const TOKEN = process.env.TOKEN; // set this in Railway Variables
const WELCOME_CHANNEL_ID = "1436988286815178833";
const LEAVE_CHANNEL_ID = "1436988512594296873";

// ====== When Bot Is Ready ======
client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

// ====== When a New Member Joins ======
client.on("guildMemberAdd", member => {
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (!channel) return console.error("❌ Welcome channel not found!");

  channel.send(
`👋 **HI ${member.user} WELCOME TO NETHERVERSE SMP!**

📢 Get updates at <#1323572624856715296>
-----------------------------------------------------
💬 Chat with our community at <#1310116007712522333>
---------------------------------------------------------
📖 Read rules at <#1305377381464277002>  
----------------------------------------------------------
⚠️ Get maintenance updates at <#1325110028251955301>`
  );
});

// ====== When a Member Leaves ======
client.on("guildMemberRemove", member => {
  const channel = member.guild.channels.cache.get(LEAVE_CHANNEL_ID);
  if (!channel) return console.error("❌ Goodbye channel not found!");
  channel.send(`😢 **${member.user.tag}** has left **NETHERVERSE SMP**. We’ll miss you! 👋`);
});

// ====== Login ======
client.login(TOKEN);
