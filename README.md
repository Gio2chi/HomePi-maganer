# Admin Panel

A comprehensive admin panel for managing various server-side services and applications.

## Features

- Minecraft server management
- Torrent client integration
- System statistics monitoring
- Website logging and management

## Structure

The application is built using Express.js and follows a modular structure:

- /routes: API and page routing
- /modules: Core functionality modules
- /public: Static assets (JS, CSS, images)
- /views: Pug templates for rendering pages

## Key Components

### Minecraft Server Management

- Start/stop Minecraft servers
- View server console
- Send commands to running servers

### Torrent Management

- Add torrents via magnet links
- View and manage active downloads
- Search for torrents

### System Statistics

- Real-time CPU, RAM, and network usage monitoring
- Graphical display using custom gauges

### Website Logging

- Centralized logging for multiple websites
- Real-time console view for each website

## Security

- Session-based authentication
- Environment variable configuration for sensitive data

## Setup

1. Clone the repository
2. Install dependencies: npm install
3. Set up environment variables (see .env.example)
4. Start the server: npm start

## API Endpoints

- /api/minecraft: Minecraft server operations
- /api/torrent: Torrent client interactions
- /api/stats: System statistics retrieval
- /api/websites: Website logging and management

## Frontend

- Responsive design using custom CSS
- Interactive UI with jQuery for dynamic content updates

## Logging

- Winston logger for structured logging
- Separate log files for errors, warnings, and combined logs

## Note

This project is designed for personal use and includes specific configurations. Modify as needed for your environment.

For detailed functionality, refer to individual module and route files.
