const { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, REST, Routes } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
  ]
});

const TOKEN = process.env.DISCORD_TOKEN;
const TICKETS_FILE = 'tickets.json';
const CLIENT_ID = '1503084043225534616';

// Load and save ticket data
function loadTickets() {
  try {
    if (fs.existsSync(TICKETS_FILE)) {
      return JSON.parse(fs.readFileSync(TICKETS_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading tickets:', error);
  }
  return {};
}

function saveTickets(tickets) {
  fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2));
}

// Bot is online
client.once('ready', async () => {
  console.log(`✅ Bot is online: ${client.user.tag}`);
  
  // Register slash commands
  const commands = [
    {
      name: 'panel',
      description: 'Send the ZYXE Clan Apply panel'
    }
  ];

  try {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ Slash commands registered!');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
});

// Member join event
client.on('guildMemberAdd', async (member) => {
  try {
  // Find welcome channel
    let welcomeChannel = member.guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && c.name === 'welcome'
    );

    if (!welcomeChannel) {
      // Fallback: use the first text channel
      welcomeChannel = member.guild.channels.cache.filter(
        (c) => c.type === ChannelType.GuildText
      ).first();
    }

    if (!welcomeChannel) return;

    const welcomeEmbed = new EmbedBuilder()
      .setTitle(`🎉 Welcome to the server, ${member.user.username}!`)
      .setDescription(
        `Welcome ${member}! We are happy to have you here.\n\n` +
        `Please read the rules and enjoy your stay.\n\n` +
        `Need support or want to apply? Use the **/panel** command to open an application ticket.`
      )
      .setColor('#0099ff')
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '👤 Username', value: `${member.user.tag}`, inline: true },
        { name: '📅 Joined', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        { name: '👥 Member Count', value: `Now ${member.guild.memberCount} members`, inline: true }
      )
      .setFooter({ text: 'ZYXE Ticket System | Welcome!' });

    await welcomeChannel.send({ embeds: [welcomeEmbed] });
  } catch (error) {
    console.error('Error sending welcome message:', error);
  }
});

// Button interactions
client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    const { commandName } = interaction;

    // /panel Command
    if (commandName === 'panel') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          content: '❌ You need Administrator permissions to use this command.',
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('🎟️ ZYXE Clan Apply')
        .setDescription('Apply for ZYXE Clan!\n\nClick the button below to open your application ticket and start the clan application process.')
        .setColor('#1D82F5')
        .setImage('https://probot.media/7dDF4CZ5xH.gif')
        .addFields(
          { name: '📌 How to apply', value: '1. Press the button below\n2. Follow the application template in your ticket\n3. Upload screenshots as requested', inline: false }
        )
        .setFooter({ text: 'ZYXE Clan Apply' });

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('📝 Start Apply')
            .setStyle(ButtonStyle.Success)
        );

      await interaction.deferReply({ ephemeral: true });
      await interaction.channel.send({ embeds: [embed], components: [row] });
      return interaction.editReply({
        content: '✅ Apply panel has been posted successfully.'
      });
    }
  }

  if (!interaction.isButton()) return;

  const { customId, user, guild } = interaction;

  // Create ticket button
  if (customId === 'create_ticket') {
    const tickets = loadTickets();
    const guildTickets = tickets[guild.id] || {};

    if (guildTickets[user.id]) {
      return interaction.reply({
        content: '❌ You already have an open application ticket. Please close it before opening a new one.',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    // Find or create category
    let category = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildCategory && c.name === 'ZYXE Applications'
    );

    if (!category) {
      category = await guild.channels.create({
        name: 'ZYXE Applications',
        type: ChannelType.GuildCategory
      });
    }

    // Create apply channel
    const channelName = `apply-${user.username}`.toLowerCase().slice(0, 32);
    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category,
      topic: `ZYXE Clan application channel for ${user.tag}`,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
        },
        {
          id: client.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
        }
      ]
    });

    // Ticket speichern
    if (!tickets[guild.id]) tickets[guild.id] = {};
    tickets[guild.id][user.id] = {
      channel_id: ticketChannel.id,
      user_id: user.id,
      user_name: user.username,
      created_at: new Date().toISOString()
    };
    saveTickets(tickets);

    // Nachricht im Ticket
    const embed = new EmbedBuilder()
      .setTitle('📝 ZYXE Clan Application')
      .setDescription(`Welcome ${user}!\n\nYour application ticket is now open. Staff has been notified and will join shortly.`)
      .setColor('#1D82F5')
      .setFooter({ text: 'ZYXE Clan Apply | Please fill out all fields' });

    const closeRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('🔒 Close Application')
          .setStyle(ButtonStyle.Danger)
      );

    await ticketChannel.send({
      content: `<@&1486314378746925148> Welcome ${user}! A new application ticket has been opened.`,
      allowedMentions: { parse: [], roles: ['1486314378746925148'] }
    });
    await ticketChannel.send({ embeds: [embed], components: [closeRow] });

    const applicationTemplate = `📝 **ZYXE CLAN APPLICATION**

User Name: ${user.tag}
Rank:
Gamepasses:
Playtime per Day:
Active in Farming (Yes / No):
Willing to Donate 100M to Clan (Yes / No):

📸 Screenshots (REQUIRED):
- Inventory / Pets
- Gamepasses
- Rank

⚠️ Requirements:
<#1497931480993890364>

⬇️ Post your screenshots below

Best regards,
Your ZYXE Team`;

    await ticketChannel.send({ content: applicationTemplate });

    return interaction.editReply({
      content: `✅ Your application channel has been created: ${ticketChannel}`
    });
  }

  // Close ticket button
  if (customId === 'close_ticket') {
    const { channel } = interaction;
    const tickets = loadTickets();
    const guildTickets = tickets[guild.id] || {};

    let ticketUser = null;
    for (const [userId, ticketData] of Object.entries(guildTickets)) {
      if (ticketData.channel_id === channel.id) {
        ticketUser = userId;
        break;
      }
    }

    if (ticketUser) {
      delete tickets[guild.id][ticketUser];
      saveTickets(tickets);
    }

    const closeEmbed = new EmbedBuilder()
      .setTitle('🔒 Ticket Closed')
      .setDescription('This ticket will be deleted in 5 seconds...')
      .setColor('#ff0000');

    await interaction.reply({ embeds: [closeEmbed] });

    const category = channel.parent;
    setTimeout(async () => {
      await channel.delete().catch(() => {});
      if (category && category.children.cache.filter((c) => c.type === ChannelType.GuildText).size === 0) {
        category.delete().catch(() => {});
      }
    }, 5000);
  }
});

client.login(TOKEN);
