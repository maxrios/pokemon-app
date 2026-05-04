# Pokefin Battling

## Overview
Based on ./backend/README_FULLSTACK.md, we'll be introducing new functionality to support battling. This project will be broken up into two parts: adding pokemon to your collection from an existing "pokedex" and battling pokemon that you own.

## Collecting pokemon
The first feature will move us away from calling the "data/pokemon.json" file and towards reading pokemon data from a mongoDB database. Users will be able to click on a card and add a pokemon to their collection. Users will also be able to remove pokemon from their collection. Users will be limited to adding pokemon that already exist. However, we'll need to create an "add new pokemon" button so that we can test the feature with custom pokemon.

### DB
We'll need to build 3 new tables:
- A pokemon table that will contain all of our unique pokemon data, as described in pokemon.json.
- A user table that will only store a unique ID and unique name. We don't care about auth, we just care about associating a collection with a pokemon.
- An ownership table, which will act as a junction table between pokemon and users, to store a user's collection.

### Front-end
- We'll want to grey out pokemon cards that the user doesn't currently own, which means creating a new field.
- We'll add a new pokemon "add" button and dialog to add pokemon for testing.
- We'll want to add a "catch" or "release" button to the detailed dialog view, depending on the ownership of the pokemon for that specific user.

### Back-end
- Based on the backend/README.md, we'll want to create a collection endpoint to POST, GET, and DELETE pokemon from a users collection. This is where the front-end will tie into.
- We'll aslo want to add a new endpoint to add new pokemon to the overall pokemon pool, for testing purposes. Don't worry about deleting pokemon yet.

## Battling system
Under the new battling system, trainers will be able to put their pokemon up against each other to see who comes out on top. More details can be found in backend/README_FULLSTACK.md, including the battle mechanics. Trainers can only use pokemon they've caught.

### DB
We'll need to implement 3 new tables:
1. A battle history table that will keep track of all battles initated by ANY trainer. I recommend the columns: battleId, startTimestamp, endTimestamp, winnerPokemonId, pokemon1Id, and pokemon2Id (these field names can be changed).
2. A battle turn table that will keep track of what happened during/after a turn. I recommend the columns: battleId, turnIndex, isOver, whichPokemonWentFirstId, pokemon1Damage, pokemon2Damage (these field names can be changed).

### Front-end
The front-end will have a new battle window, allowing users to view a history of battles performed by ALL trainers. This will be a row of battles, starting with the latest battle. We'll query the battle history table to populate this view. When a trainer clicks "watch battle", they'll be sent the full battle turns for that battle. If you're the trainer that initated the battle, you'll be automatically brought to this view. The battle window will just be for viewing battles and battle history.

The original pokemon grid view is where trainers can initate a battle with their pokemon. We'll need to update the view to allow the selection of 2 owned pokemon. We need to avoid rendering the grid view another time.

Use your best judgement when designing the battle history view and the battle simulation view. There are more details in backend/README_FULLSTACK.md.

### Back-end
We'll need to create a new endpoint that allows users to initiate a battle between 2 of their pokemon. This endpoint will accept 2 pokemon IDs. It will then check that the trainer owns the pokemon. If so, it will initialize the battle. Review backend/README_FULLSTACK.md for more details, but the gist is that battles will be calculated async and the battle data will be returned back to the user and simulated so that it appears to be live. Once the battle is initialized, it will enter a queue, where eventually the battle service can pick the battle up to complete. This is to simulate the battle service only being able to run so many battles at once. If a battle fails mid-calculation, we'll want an available service to pick up the job again and continue where we left off. We'll do this by not popping when picked up, but instead when completed. When a battle is picked up by the battle service, it'll mark the item with a flag that has a TTL of 3s. Once that flag expires, a new service will be able to pick it up from where it left off. This will require the battle service to see if this battle started by querying the battle turn table with the battle ID.

The battle service will do 3 things:
1. Check to see if this battle was previously started by querying the battle turn table. If so, pick up where we left off.
2. Initiate the battle loop from the starting point.
3. Broadcast the battle turns back to the user once the battle has been calculated.

The battle loop does the following:
1. Determine turn order based on the speed of the pokemon.
2. Pokemon 1 (faster) will attack.
3. Determine if the battle is over. If so, end.
4. Pokemon 2 (slower) will attack.
5. Determine if the battle is over. If so, end.

Attacks will used an attach method that is based on the calculation in backend/README_FULLSTACK.md.
