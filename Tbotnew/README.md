# 🌱 TBot - Plants vs Zombies Heroes Discord Bot

<div align="center">

![Discord Bot](https://img.shields.io/badge/Discord-Bot-7289da?style=for-the-badge&logo=discord&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)


**A comprehensive Discord bot for the Plants vs Zombies Heroes card game community**

*Showcasing optimized decklists, providing card information, and offering interactive features for players*

</div>

---

## 🌟 Features

### 🃏 Deck Showcase
- **Extensive Deck Library**: Access to hundreds of community-created and optimized decklists
- **Hero-Specific Decks**: Decks organized by all 20 heroes (10 Plant + 10 Zombie)
- **Deck Categories**: Budget decks, competitive decks, and specialized strategies
- **Easy Navigation**: Simple commands and aliases to find any deck quickly

### 📚 Card Information
- **Comprehensive Card Database**: Information for all Plants vs Zombies Heroes cards
- **Plant & Zombie Cards**: Detailed stats, abilities, and descriptions
- **Trick Cards**: Complete trick card reference
- **Search Functionality**: Find cards by name

### 🎮 Interactive Features
- **8-Ball Fortune Teller**: Get random predictions and answers
- **Wheel of Fortune**: Spin for random card to add to a deck
- **Random Deck Generator**: Get random deck suggestions
- **Custom Status System**: Personalized user statuses
- **Bug Report System**: Easy way to report issues

### 🛠️ Utility Commands
- **Deck Builder Integration**: Tools for deck building assistance
- **Tournament Information**: Stay updated on community tournaments
- **Help System**: Comprehensive help with organized categories
- **Donation Links**: Support the bot development
## 📖 Usage

### Basic Commands
- `@Tbot help` - Display all available commands organized by category
- `@Tbot [hero_name]` - View decks for a specific hero (e.g., `@Tbot gs` for Green Shadow)
- `@Tbot [deck_name]` - View a specific deck (e.g., `@Tbot boltbolt`)
- `@Tbot [card_name]` - Get information about a specific card

### Hero Categories
**Plant Heroes:**
- Green Shadow (GS), Solar Flare (SF), Wall Knight (WK)
- Spudow (SP), Rose (RO), Captain Combustible (CC)
- Grass Knuckles (GK), Beta-Carrotina/Citron, Chompzilla (CZ), Night Cap (NC)

**Zombie Heroes:**
- Brain Freeze (BF), Electric Boogaloo (EB), Huge-Gigantacus/SuperBrains
- Impfinity (IF), Immorticia (IM), Neptuna (NT)
- Professor Brainstorm (PB), Rustbolt (RB), Smash (SM), Z-Mech (ZM)

### Slash Commands
| Command | Description | Example |
|---------|-------------|---------|
| `/8ball` | Ask the magic 8-ball a question | `/8ball Will I win my next game?` |
| `/wheel` | Spin the wheel of fortune | `/wheel` |
| `/randomdeck` | Get a random deck suggestion | `/randomdeck` |
| `/bugreport` | Report bugs or issues | `/bugreport Found a typo in deck X` |

### Popular Deck Commands
| Hero | Command | Popular Decks |
|------|---------|---------------|
| 🌱 **Green Shadow** | `@Tbot gs` | `@Tbot shadowfather`, `@Tbot cartasbuenas` |
| ☀️ **Solar Flare** | `@Tbot sf` | `@Tbot budgetsf`, `@Tbot healburn` |
| 🛡️ **Wall Knight** | `@Tbot wk` | `@Tbot budgetwk`, `@Tbot chemotherapy` |
| 🧠 **Brain Freeze** | `@Tbot bf` | `@Tbot watersports`, `@Tbot himpter` |
| ⚡ **Electric Boogaloo** | `@Tbot eb` | `@Tbot budgetburn`, `@Tbot seacret` |
| 🔩 **Rustbolt** | `@Tbot rb` | `@Tbot boltbolt`, `@Tbot scimania` |

## 🏗️ Project Structure

```
TBOT/
├── 📁 commands/
│   └── 📁 Slash/           # Slash command implementations
├── 📁 Events/              # Discord.js event handlers
├── 📁 Misc/               # Miscellaneous commands
├── 📁 Utilities/          # Helper functions and utilities
├── 📄 commands.json       # Command aliases and mappings (8,700+ lines)
├── 📄 config.json         # Bot configuration
├── 📄 index.js           # Main bot file
├── 📄 deploy-commands.js  # Slash command deployment
├── 📄 custom_statuses.xlsx # Custom status data
└── 📄 package.json       # Dependencies and scripts
```

## ️ Technologies Used

<div align="center">

| Technology | Purpose | Version |
|------------|---------|---------|
| ![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?logo=discord) | Discord API wrapper | v14.19.3 |
| ![Node.js](https://img.shields.io/badge/Node.js-Runtime-339933?logo=nodedotjs) | JavaScript runtime | v16+ |
| ![MySQL](https://img.shields.io/badge/MySQL2-Database-4479A1?logo=mysql) | Database connectivity | v3.12.0 |
| ![Express](https://img.shields.io/badge/Express-Framework-000000?logo=express) | Web framework | v4.18.2 |
| ![Axios](https://img.shields.io/badge/Axios-HTTP-5A29E4) | HTTP requests | v1.11.0 |

</div>

### Additional Libraries
- **Fuzzy-Search**: Smart search functionality

## 💡 Feedback & Suggestions

While this is a personal project, I welcome feedback from the Plants vs Zombies Heroes community:

### 🎯 How You Can Help
- 🃏 **Deck Suggestions**: Recommend new decklists to add to the bot
- 📊 **Card Updates**: Let me know if any card information needs updating
- 🐛 **Bug Reports**: Found an issue? Use `/bugreport` in Discord
- � **Feature Ideas**: Suggest new features or improvements
- 🎮 **Community Input**: Share your thoughts on the bot's functionality
- 💰 **Donations**: You can donate to Tbot through [BuyMeACoffee](https://buymeacoffee.com/tbotpvzh)

### � How to Reach Me
- Use the `/bugreport` command in Discord for quick feedback
- Open a GitHub issue for detailed suggestions
- Contact me directly via email for private matters

*Note: This is a personal project maintained by Tbone Gaming. While I appreciate community input, all development decisions remain with the project owner.*

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Tbone Gaming**
- Email: Tbonegaming18@gmail.com
- GitHub: [@tbonegaming344](https://github.com/tbonegaming344)

## 🙏 Acknowledgments

- Plants vs Zombies Heroes community for deck submissions and feedback
- EA/PopCap for creating the amazing Plants vs Zombies Heroes game
- Discord.js community for excellent documentation and support

## � Statistics

<div align="center">

| 📈 Metric | 🔢 Count |
|-----------|----------|
| **Total Decks** | 100+ |
| **Heroes Supported** | 22 |
| **Card Database** | 1,000+ |
| **Command Aliases** | 8,700+ |
| **Active Servers** | 400+ |

</div>

## 🏆 Special Thanks

Recognition for community support:
- 🥇 **Community Members**: For using the bot and providing feedback
- 🥈 **Deck Submitters**: For sharing amazing decklists via suggestions
- 🥉 **Bug Reporters**: For helping identify and report issues

---

<div align="center">

### 🌟 **Star this repository if you find it helpful!** 🌟

**Made with ❤️ for the Plants vs Zombies Heroes community**

*This bot is fan-made and not officially associated with EA or PopCap Games.*

![Footer](https://img.shields.io/badge/Built%20with-Discord.js-5865F2?style=for-the-badge&logo=discord)
![Footer](https://img.shields.io/badge/Powered%20by-Community-orange?style=for-the-badge&logo=github)

</div>
