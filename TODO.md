### 1. Database guild entry
```json
{
    "id": "",
    "logChannel": "",
    "warned": [
        {
            "userId": "",
            "count": 2,
            "reasons": [
                "reason 1",
                "reason 2"
            ]
        }
    ],
    "banned": [ // Bans might not be needed since discord keeps track of that but it doesn't keep track of the times the user has been banned
        {
            "userId": "",
            "reason": "",
            "count": 0
        }
    ],
    "kicked": [
        {
            "userId": "",
            "reason": "",
            "count": 0
        }
    ]
}
```

### 2. Logging to log channel

### 3. Argument checks

### 4. Commands
- warn
- baninfo
- kickinfo
- warninfo