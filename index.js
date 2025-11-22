// index.js
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const express = require("express");

// ====== EXPRESS SERVER ======
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("Bot is running!"));
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
const TOKEN = process.env.TOKEN; // Add your token as an environment variable
const WELCOME_CHANNEL_ID = "1436988286815178833"; // replace with your welcome channel ID
const LEAVE_CHANNEL_ID = "1436988512594296873";   // replace with your leave channel ID

// ====== READY EVENT ======
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ====== WELCOME NEW MEMBERS ======
client.on("guildMemberAdd", (member) => {
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (!channel) return console.error("Welcome channel not found!");

  const embed = new EmbedBuilder()
    .setDescription(
`HI ${member.user}, WELCOME TO NETHERVERSE SMP!

📢Get updates at <#1436990110544560140>
-----------------------------------------------------
💬Chat with our community at <#1436989839705636894>
---------------------------------------------------------
📖Read rules at <#1305377381464277002> 
---------------------------------------------------------
🔌Get ip and port at <#143699221486475677
----------------------------------------------------------
⚠️Get maintenance updates at <#1436991629583192184>`
    )
    .setImage("https://cdn.discordapp.com/attachments/1305377381464277005/1436019007642800300/standard.gif")
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }));

  channel.send({ embeds: [embed] });
});

// ====== GOODBYE MEMBERS ======
client.on("guildMemberRemove", (member) => {
  const channel = member.guild.channels.cache.get(LEAVE_CHANNEL_ID);
  if (!channel) return console.error("Goodbye channel not found!");
  channel.send(`😢 **${member.user.tag}** has left **NETHERVERSE SMP**. We’ll miss you! 👋``);
});

// ====== LOGIN ======
client.login(TOKEN);
