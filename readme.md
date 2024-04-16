# Readme

## Pre-requisites

Node.js > 20 is required.

## Installing

First, type following command to install the workspace dependencies:

`npm install`

Later, type following command to install the dependencies of the components:

`npm run install:all`

## Initializing

In the case of would like to initialize the database, switch to the server dir:

`cd apps/server`

Then, type the following command:

`npm run init`

Wait it run until finish, then the database is ready for use.

## Running

It is required to start both of the components to work, start at project root dir, then types:

`npm run dev:server` to start the server

and

`npm run dev:view` to start the frontend view

The url for the frontend view is `http://localhost:3000`

## Issue

Windows defender might false alarm over the source code create by react

[My own JavaScript and HTML files detected as Trojan:Script/Wacatac.H!ml](https://www.reddit.com/r/webdev/comments/1bzv5ll/my_own_javascript_and_html_files_detected_as/)

## Code dependency cite

Mono Repo Template: https://github.com/NiGhTTraX/ts-monorepo

Fightroute Data: https://github.com/Jonty/airline-route-data

Country Data: https://github.com/stefangabos/world_countries
