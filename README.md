# NIU-Dining-Hall-Discord-Bot
A configurable Docker-based service that sends Discord notifications when NIU dining halls offer a specified food item.

## This Discord bot had AI involved in creation:
- AI created the Docker container itself:
  -  docker-compose.yml, dockerfile, and start.sh were started by AI and later altered by hand.  
- AI created the index.js this bot is based off:
  - This bot is based on a Discord bot AI made to only check for shrimp at Neptune during lunch.
  - The orginal Shrimp Bot's puppeteer functionality was AI developed.
- What was done by a human?
  - Enviornmental varibles used to configure the bot were added.
  - de-shrimpification of the bot this new one is based off of.
- Why was AI used?
  - I am not a coder. I am a Math Major. I like logic puzzles, but I do not know libraries, syntax, etc.
  - My friends who could have helped seemed busy.
  - 
# Setup
0. Prereqs:
    - Docker
    - Linux
    - Nodejs

  
1. Clone the repo - `git clone https://github.com/XiaoDoesStuff/NIU-Dining-Hall-Discord-Bot.git`
2. go to the folder `cd NIU-Dining-Hall-Discord-Bot`
3. install npm dependancies `npm install discord.js axios cheerio puppeteer`
4. Configure docker-compose.yml - See below
5. Use docker compose `sudo docker compose up -d --build`
6. Check logs `sudo docker compose logs -f`



# Config

| Environment Variable           | Value / Notes                                                           |
|-------------------------------|--------------------------------------------------------------------------|
| DINING_BOT_TOKEN              | Discord bot token                                                        |
| CHANNEL                       | The Channel ID to send alerts to                                         |
| CHECK_PATTERSON_BREAKFAST     | Set to 1 to check the Patterson breakfast menu daily                     |
| CHECK_PATTERSON_LUNCH         | Set to 1 to check the Patterson lunch menu daily                         |
| CHECK_PATTERSON_DINNER        | Set to 1 to check the Patterson dinner menu daily                        |
| CHECK_NEPTUNE_BREAKFAST       | Set to 1 to check the Neptune breakfast menu daily                       |
| CHECK_NEPTUNE_LUNCH           | Set to 1 to check the Neptune lunch menu daily                           |
| CHECK_NEPTUNE_DINNER          | Set to 1 to check the Neptune dinner menu daily                          |
| WHEN_TO_CHECK                 | Set to an hour integer in military time                                  |
| KEYWORDSTOCHECK               | Set to a collection of keywords used to scan the menus (lowercase only)  |

### Example `docker-compose.yml` configuration


| Environment Variable         | Example Value / Meaning                                    |
|------------------------------|------------------------------------------------------------|
| DINING_BOT_TOKEN             | UR_BOT_TOKEN                                               |
| CHANNEL                      | UR_CHANNEL_NUMBER_ID                                       |
| CHECK_PATTERSON_BREAKFAST    | 1   — Will check the Patterson Breakfast daily             |
| CHECK_PATTERSON_LUNCH        | 0   — Will not check Patterson Lunch                       |
| CHECK_PATTERSON_DINNER       | 1   — Will check the Patterson Dinner daily                |
| CHECK_NEPTUNE_BREAKFAST      | 1   — Will check the Neptune Breakfast daily               |
| CHECK_NEPTUNE_LUNCH          | 1   — Will check the Neptune Lunch daily                   |
| CHECK_NEPTUNE_DINNER         | 1   — Will check the Neptune Dinner daily                  |
| WHEN_TO_CHECK                | 8   — Will scan the menu and alert you at 8 AM             |
| KEYWORDSTOCHECK              | ["pizza", "fries"] — looks for pizza and fires in menus    |

