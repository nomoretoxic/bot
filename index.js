// =========================================
// ✅ IMPORTS
// =========================================
const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

require("dotenv").config();

// =========================================
// 🤖 DISCORD CLIENT
// =========================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User]
});

// =========================================
// 🔧 ENV VARIABLES
// =========================================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const OPEN_CATEGORY_ID = process.env.OPEN_CATEGORY_ID;
const CLOSED_CATEGORY_ID = process.env.CLOSED_CATEGORY_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID;
const LEAVE_CHANNEL_ID = process.env.LEAVE_CHANNEL_ID;
const SUPPORT_ROLE_ID = process.env.SUPPORT_ROLE_ID; // support role

// =========================================
// 📝 SLASH COMMANDS
// =========================================
const commands = [
  new SlashCommandBuilder()
    .setName("autorole")
    .setDescription("Give yourself a role.")
    .addRoleOption(opt =>
      opt.setName("role").setDescription("Choose a role").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("say")
    .setDescription("Bot repeats your message (Admin only)")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addStringOption(opt =>
      opt.setName("message").setDescription("Message to send").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ticketpanel")
    .setDescription("Send the ticket panel")
].map(cmd => cmd.toJSON());

// Register Slash Commands
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("📌 Registering slash commands...");
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("✅ Slash commands registered!");
  } catch (error) {
    console.error(error);
  }
})();

// =========================================
// 🤖 BOT READY
// =========================================
client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

// =========================================
// 📌 WELCOME / LEAVE SYSTEM
// =========================================
client.on("guildMemberAdd", (member) => {
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setDescription(
`HI ${member.user}, WELCOME TO NETHERVERSE SMP!

📢 Updates: <#1436990110544560140>
------------------------------------------------
💬 Chat: <#1436989839705636894>
-----------------------------------------
📖 Rules: <#1305377381464277002>
-----------------------------------------
🔌 IP & Port: <#1436992214864756776>
---------------------------------------------
⚠ Maintenance update at: <#1436991629583192184>`
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setColor("#00ffcc")
    .setImage("https://cdn.discordapp.com/attachments/1305377381464277005/1436019007642800300/standard.gif");

  channel.send({ embeds: [embed] });
});

client.on("guildMemberRemove", (member) => {
  const channel = member.guild.channels.cache.get(LEAVE_CHANNEL_ID);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setDescription(`😢 **${member.user.tag}** left the server.`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setColor("#ff4d4d");

  channel.send({ embeds: [embed] });
});

// =========================================
// 🛑 ANTI-LINK SYSTEM
// =========================================
const linkRegex = /(https?:\/\/[^\s]+)/gi;

client.on("messageCreate", async (message) => {
  if (!message.guild || message.guild.id !== GUILD_ID) return;
  if (message.author.bot) return;

  if (linkRegex.test(message.content)) {
    try {
      await message.delete();

      await message.author.send(
        "⚠️ **Links are not allowed in Nethervers SMP!**"
      );

      const logChannel = message.guild.channels.cache.get(LOG_CHANNEL_ID);
      if (logChannel) {
        logChannel.send(
          `🛑 **Link Deleted**\n👤 User: <@${message.author.id}>\n💬 Message: \`${message.content}\`\n📌 Channel: <#${message.channel.id}>`
        );
      }

    } catch (err) {
      console.error("Anti-link error:", err);
    }
  }
});

// =========================================
// 🎫 TICKET SYSTEM
// =========================================
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  // Create Ticket
  if (interaction.customId === "create_ticket") {
    const guild = interaction.guild;

    const existing = guild.channels.cache.find(
      c => c.name === `ticket-${interaction.user.id}`
    );

    if (existing) {
      return interaction.reply({
        content: "❌ You already have an open ticket.",
        ephemeral: true
      });
    }

    const ticket = await guild.channels.create({
      name: `ticket-${interaction.user.id}`,
      parent: OPEN_CATEGORY_ID,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        {
          id: interaction.user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        },
        {
          id: SUPPORT_ROLE_ID, // Support staff can see it
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        }
      ]
    });

    const embed = new EmbedBuilder()
      .setTitle("Ticket Created")
      .setDescription("A staff member will be with you shortly.\nClick the button below to close this ticket.")
      .setColor("Green");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("Close")
        .setStyle(ButtonStyle.Danger)
    );

    await ticket.send({
      content: `<@${interaction.user.id}> | <@&${SUPPORT_ROLE_ID}>`,
      embeds: [embed],
      components: [row]
    });

    return interaction.reply({
      content: `🎫 Ticket created: ${ticket}`,
      ephemeral: true
    });
  }

  // Close Ticket
  if (interaction.customId === "close_ticket") {
    const channel = interaction.channel;
    await channel.setParent(CLOSED_CATEGORY_ID);
    await channel.send("Ticket closed. Thank you!");
  }
});

// =========================================
// 📝 SLASH COMMAND HANDLING
// =========================================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "autorole") {
    const role = interaction.options.getRole("role");
    const member = interaction.guild.members.cache.get(interaction.user.id);

    if (!role.editable) {
      return interaction.reply({
        content: "❌ I cannot give that role.",
        ephemeral: true
      });
    }

    await member.roles.add(role);
    return interaction.reply({
      content: `🎉 You received the **${role.name}** role!`,
      ephemeral: true
    });
  }

  if (interaction.commandName === "say") {
    const text = interaction.options.getString("message");
    return interaction.reply(text);
  }

  if (interaction.commandName === "ticketpanel") {
    const embed = new EmbedBuilder()
      .setTitle("Support Ticket")
      .setDescription("Click below to open a ticket.")
      .setColor("Blue");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("create_ticket")
        .setLabel("Create Ticket")
        .setStyle(ButtonStyle.Primary)
    );

    return interaction.reply({ embeds: [embed], components: [row] });
  }
});

// =========================================
// 🔑 LOGIN
// =========================================
client.login(TOKEN);






   
