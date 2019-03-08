### ~~1. Database guild entry~~
```js
// Database structure

const Violation = {
    "id": String,
    "timestamp": String,
    "by": String,
    "reason": String
};

const User = {
    "id": String,
    "isBanned": Boolean,
    "isMuted": Boolean,
    "warns": Array<Violation>,
    "bans": Array<Violation>,
    "kicks": Array<Violation>
 }

const Guild = {
    "id": String,
    "logChannel": String,
    "muteRole": String,
    "users": Array<User>
}
```

### ~~2. Logging to log channel~~

### ~~3. Argument checks~~

### ~~4. Change commands to classes~~

### 5. Commands
- ~~warn~~
- ~~search~~

### 6. User profile
- https://cdn.discordapp.com/attachments/407649017581928458/548980447540019210/unknown.png
- https://i.pinimg.com/originals/54/24/d7/5424d76eed3316c72566192edba92a72.jpg

### 7. Persistent mute with optional time
- If the user tries to bypass the role when rejoining the bot would apply the mute again and double the time
- isMuted property on Users in the database

#### Create a muted role for the guild and keep it updated when new channels are created
##### Currently this functionality is in the setup command, I personally think that is better than on guildCreate
1. Create muted role on `guildCreate`
2. Add role id to guild entry in the database
3. Add permission overrides to all channels for the created role
4. On `channelCreate` add permission overrides for the muted role

#### Keep users muted when the try to bypass the role
1. ~~On `guildMemberAdd` check if user exists in database and see if `isMuted` is true~~
2. ~~If user exists and `isMuted` is true re-add the muted role~~

### 8. ~~Change setlog to an interactive setup command~~