# NIU-Dining-Hall-Discord-Bot
A configurable Discord bot that sends Discord notifications to specific Discord channels when NIU dining halls offer a specified food item.

This bot can be setup and used either with Docker or directly on host. 

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



# Setup (Docker)
0. Prereqs:
    - Docker
    - Nodejs
1. Clone the repo - `git clone https://github.com/XiaoDoesStuff/NIU-Dining-Hall-Discord-Bot.git`
2. go to the folder `cd NIU-Dining-Hall-Discord-Bot`
3. Configure Config.env - See below
4. Use docker compose `sudo docker compose up -d --build`  The Dockerfile will:
  - Run apt-get update and  Install Chromium and Chromium extensions needed inside the container for puppeteer
  - Insall the npm packages needed inside the container
  - Run the start.sh which runs the javascript bot
5. Check logs `sudo docker compose logs -f`

# Setup (Directly on host)
0. Prereqs:
    - Nodejs version >= 20
1. Clone the repo - `git clone https://github.com/XiaoDoesStuff/NIU-Dining-Hall-Discord-Bot.git`
2. go to the folder `cd NIU-Dining-Hall-Discord-Bot`
3. Configure Config.env - See below
4. Run the Initial-setup.sh - `sudo bash Initial-setup.sh` With sudo permissions, Initial-setup.sh Will
  - Run apt-get update and install neccessary Chromium and Chromium extensions needed onto the machine for puppeteer
  - Will insall the npm packages needed
  - Run the start.sh which runs the javascript bot
5. on subsequent runs, use start.sh - `bash start.sh`


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

### Example Config.env configuration


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

