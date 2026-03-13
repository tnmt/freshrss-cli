# freshrss-cli

CLI tool for [FreshRSS](https://freshrss.org/) using the Google Reader API.

## Setup

```sh
bun install
cp .env.example .env  # Edit with your FreshRSS credentials
```

`.env` requires:

```
FRESHRSS_URL=https://your-freshrss.example.com
FRESHRSS_USER=your-username
FRESHRSS_API_PASSWORD=your-api-password
```

API password is set in FreshRSS under Settings > Profile > API password.

## Usage

```sh
bun run src/main.ts <resource> <action> [id] [--flags]
```

### Feed commands

```sh
freshrss feed list                                    # List subscribed feeds
freshrss feed show <id>                               # Show feed details
freshrss feed add <url> [--title <title>] [--folder <folder>]  # Subscribe
freshrss feed delete <id>                             # Unsubscribe
```

### Article commands

```sh
freshrss article list                        # List unread articles
freshrss article list --feed <feed-id>       # Filter by feed
freshrss article list --folder <name>        # Filter by folder
freshrss article list --all                  # Include read articles
freshrss article list --count <n>            # Limit results (default 20)
freshrss article show <id>                   # Show article content (markdown)
freshrss article read <id>                   # Mark as read
freshrss article unread <id>                 # Mark as unread
freshrss article star <id>                   # Star article
freshrss article unstar <id>                 # Unstar article
```

### Global flags

```
--json       Output as JSON
--help       Show help
--version    Show version
```

## Install globally

```sh
bun link
```
