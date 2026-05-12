import discord
from discord.ext import commands
from discord import app_commands
import os
from dotenv import load_dotenv
import json

load_dotenv()
TOKEN = os.getenv('DISCORD_TOKEN')

intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True
intents.members = True

bot = commands.Bot(command_prefix="/", intents=intents)

# Speichern von Ticket-Daten
TICKETS_FILE = "tickets.json"

def load_tickets():
    if os.path.exists(TICKETS_FILE):
        with open(TICKETS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_tickets(tickets):
    with open(TICKETS_FILE, 'w') as f:
        json.dump(tickets, f, indent=2)

class TicketView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="🎟️ Ticket Erstellen", style=discord.ButtonStyle.primary, custom_id="create_ticket")
    async def create_ticket(self, interaction: discord.Interaction, button: discord.ui.Button):
        guild = interaction.guild
        member = interaction.user
        
        # Prüfen ob bereits ein offenes Ticket existiert
        tickets = load_tickets()
        guild_tickets = tickets.get(str(guild.id), {})
        
        if str(member.id) in guild_tickets:
            await interaction.response.send_message(
                "❌ Du hast bereits ein offenes Ticket! Schließe es zuerst.",
                ephemeral=True
            )
            return
        
        # Ticket-Kategorie suchen oder erstellen
        category = discord.utils.get(guild.categories, name="ZYXE Tickets")
        if not category:
            category = await guild.create_category("ZYXE Tickets")
        
        # Ticket-Channel erstellen
        channel_name = f"ticket-{member.name}".lower()[:32]
        overwrite = {
            guild.default_role: discord.PermissionOverwrite(read_messages=False),
            member: discord.PermissionOverwrite(read_messages=True, send_messages=True),
            guild.me: discord.PermissionOverwrite(read_messages=True, send_messages=True)
        }
        
        ticket_channel = await category.create_text_channel(
            channel_name,
            overwrites=overwrite
        )
        
        # Ticket in Datei speichern
        if str(guild.id) not in tickets:
            tickets[str(guild.id)] = {}
        tickets[str(guild.id)][str(member.id)] = {
            "channel_id": ticket_channel.id,
            "user_id": member.id,
            "user_name": member.name
        }
        save_tickets(tickets)
        
        # Ticket-Channel Nachricht
        embed = discord.Embed(
            title="🎟️ ZYXE Ticket",
            description=f"Willkommen {member.mention}!\n\nDein Ticket wird in Kürze von unserem Support-Team bearbeitet.\n\nBitte beschreibe dein Anliegen hier.",
            color=discord.Color.blue()
        )
        embed.set_footer(text="ZYXE Ticket System")
        
        close_view = CloseTicketView()
        message = await ticket_channel.send(embed=embed, view=close_view)
        
        await interaction.response.send_message(
            f"✅ Dein Ticket wurde erstellt: {ticket_channel.mention}",
            ephemeral=True
        )

class CloseTicketView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="🔒 Ticket Schließen", style=discord.ButtonStyle.danger, custom_id="close_ticket")
    async def close_ticket(self, interaction: discord.Interaction, button: discord.ui.Button):
        channel = interaction.channel
        guild = interaction.guild
        
        # Ticket-Informationen abrufen
        tickets = load_tickets()
        guild_tickets = tickets.get(str(guild.id), {})
        
        # Finde das Ticket in der Datei
        user_id = None
        for uid, ticket_data in guild_tickets.items():
            if ticket_data["channel_id"] == channel.id:
                user_id = uid
                break
        
        if user_id:
            # Aus Datei entfernen
            del tickets[str(guild.id)][str(user_id)]
            save_tickets(tickets)
        
        embed = discord.Embed(
            title="🔒 Ticket Geschlossen",
            description="Dieses Ticket wird in 5 Sekunden gelöscht...",
            color=discord.Color.red()
        )
        await interaction.response.send_message(embed=embed)
        
        # Warte und lösche dann den Channel
        import asyncio
        await asyncio.sleep(5)
        await channel.delete()

@bot.event
async def on_ready():
    print(f"✅ Bot ist online: {bot.user}")
    try:
        synced = await bot.tree.sync()
        print(f"✅ {len(synced)} Slash-Commands synchronisiert")
    except Exception as e:
        print(f"❌ Fehler beim Synchronisieren: {e}")

@bot.tree.command(name="setup", description="Richte das Ticket-Panel ein")
@app_commands.describe(subcommand="Was möchtest du einrichten?")
async def setup(interaction: discord.Interaction):
    pass

@bot.tree.command(name="panel", description="Sende das ZYXE Ticket Panel")
@app_commands.checks.has_permissions(administrator=True)
async def panel(interaction: discord.Interaction):
    embed = discord.Embed(
        title="🎟️ ZYXE Ticket System",
        description="Willkommen zum ZYXE Ticket System!\n\n"
                    "Klicke auf den Button unten, um ein Ticket zu erstellen.\n"
                    "Unser Support-Team wird sich schnellstmöglich um dein Anliegen kümmern.",
        color=discord.Color.blue()
    )
    embed.set_thumbnail(url="https://cdn.discordapp.com/embed/avatars/0.png")
    embed.add_field(name="📋 Features", value="✅ Schnelle Bearbeitung\n✅ Privater Support\n✅ Automatische Kategorisierung", inline=False)
    embed.set_footer(text="ZYXE Ticket System | Powered by ZYXE", icon_url="https://cdn.discordapp.com/embed/avatars/0.png")
    
    view = TicketView()
    await interaction.channel.send(embed=embed, view=view)
    
    await interaction.response.send_message("✅ Panel wurde gesendet!", ephemeral=True)

@panel.error
async def panel_error(interaction: discord.Interaction, error):
    if isinstance(error, app_commands.MissingPermissions):
        await interaction.response.send_message(
            "❌ Du benötigst Administrator-Rechte um diesen Command zu nutzen!",
            ephemeral=True
        )

# Bot starten
bot.run(TOKEN)
