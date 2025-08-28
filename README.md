# Matter Energy Manager

I'm trying to create a Matter Device Energy Manager to learn more about Matter's energy management protocol. This project will serve as the DEM part of the energy management. 

You will need a Matter device that supports the device energy management cluster. I have been building one using the esp-matter framework. You can find that project https://github.com/tomasmcguinness/matter-esp32-tiny-dishwasher

This project uses matterjs and uses nextJs for the frontend and nodeJs for the backend.

## Running
To run this, you'll need to start both the frontend and backend.

For the backend
```
cd Backend
node app.js
```

For the frontend

```
cd Frontend
npm run dev
```

This code is rough around the edges, but should work!

I haven't tried it with bluetooth, so you will need to ensure your devices are on-network when commissioning.
