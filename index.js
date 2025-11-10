// ====== IMPORTS ======
const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType, 
  PermissionsBitField, 
  REST, 
  Routes, 
  SlashCommandBuilder 
} = require("discord.js");

const express = require('express');

// ====== EXPRESS SERVER ======
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

// ====== CONFIG ======
const TOKEN = process.env.TOKEN; // Set in Render env variables
const CLIENT_ID = process.env.CLIENT_ID; // Set in Render env variables
const OPEN_CATEGORY_ID = process.env.OPEN_CATEGORY_ID; // Ticket category ID
const CLOSED_CATEGORY_ID = process.env.CLOSED_CATEGORY_ID; // Closed tickets category
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID; // Welcome channel ID
const LEAVE_CHANNEL_ID = process.env.LEAVE_CHANNEL_ID; // Goodbye channel ID

if (!TOKEN || !CLIENT_ID || !OPEN_CATEGORY_ID || !CLOSED_CATEGORY_ID || !WELCOME_CHANNEL_ID || !LEAVE_CHANNEL_ID) {
  console.error("❌ One or more environment variables are missing!");
  process.exit(1);
}

// ====== CLIENT ======
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

// ====== READY EVENT ======
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ====== SLASH COMMAND REGISTRATION ======
const commands = [
  new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('Send the ticket creation panel message')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Slash commands registered!');
  } catch (err) {
    console.error(err);
  }
})();

// ====== WELCOME / LEAVE EVENTS ======
client.on("guildMemberAdd", member => {
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (!channel) return console.error("Welcome channel not found!");
  channel.send(`**${member.user.tag}** has joined. Welcome!`);
});

client.on("guildMemberRemove", member => {
  const channel = member.guild.channels.cache.get(LEAVE_CHANNEL_ID);
  if (!channel) return console.error("Leave channel not found!");
  channel.send(`**${member.user.tag}** has left. We'll miss you!`);
});

// ====== INTERACTIONS (TICKETS) ======
client.on('interactionCreate', async interaction => {
  // Slash command: /ticketpanel
  if (interaction.isChatInputCommand() && interaction.commandName === 'ticketpanel') {
    const embed = new EmbedBuilder()
      .setTitle('Support Ticket System')
      .setDescription('Click the button below to create a new ticket.')
      .setColor(0x5865F2);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel('Create Ticket')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
    return;
  }

  // Button interactions
  if (!interaction.isButton()) return;

  const guild = interaction.guild;

  if (interaction.customId === 'create_ticket') {
    const existing = guild.channels.cache.find(c => c.name === `ticket-${interaction.user.id}`);
    if (existing) {
      return interaction.reply({ content: 'You already have an open ticket.', ephemeral: true });
    }

    const ticketChannel = await guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent: OPEN_CATEGORY_ID,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
      ],
    });

    const embed = new EmbedBuilder()
      .setTitle('Ticket Created')
      .setDescription('Support will be with you soon. Click below to close this ticket.')
      .setColor(0x00FF00);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] });
    await interaction.reply({ content: `Your ticket has been created: ${ticketChannel}`, ephemeral: true });
  }

  if (interaction.customId === 'close_ticket') {
    const channel = interaction.channel;

    await channel.setParent(CLOSED_CATEGORY_ID);
    await channel.permissionOverwrites.set([{ id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }]);
    await channel.send('Ticket closed. Thank you!');
  }
});

// ====== LOGIN ======
client.login(TOKEN);
