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
    "warns": Array<Violation>,
    "bans": Array<Violation>,
    "kicks": Array<Violation>
 }

const Guild = {
    "id": String,
    "logChannel": String,
    "users": Array<User>
}
```

### ~~2. Logging to log channel~~

### ~~3. Argument checks~~

### ~~4. Change commands to classes~~

### 5. Commands
- ~~warn~~
- ~~search~~
