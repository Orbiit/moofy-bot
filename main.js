var Discord = require('discord.io');
var Token = require('./token.json');
var fs = require('fs');
var bot = new Discord.Client({
  autorun: true,
  token: Token.token
});
var moneies,
userdata,
tempChannel,
robbers = [];

fs.readFile("./moneies.json", "utf8", (err, data) => {
  moneies = JSON.parse(data);
});
fs.readFile("./users.json", "utf8", (err, data) => {
  userdata = JSON.parse(data);
  for (var user in userdata) {
    if (typeof userdata[user] !== "object") userdata[user] = {version: 0};
    switch (userdata[user].version) {
      case 0:
        userdata[user].lastHourly = 0;
      case 1:
        userdata[user].lastDaily = 0;
      case 2:
        userdata[user].dailyStreak = 0;
        userdata[user].hourlyStreak = 0;
    }
    userdata[user].version = 3;
  }
  updateUserData();
});

function createUser(userID) {
  setMoney(userID, 500);
  setMoney("bot", moneies.bot - 500);
  updateUserData(userdata[userID] = {
    version: 2,
    lastHourly: 0,
    lastDaily: 0,
    dailyStreak: 0,
    hourlyStreak: 0
  });
}
function updateUserData() {
  fs.writeFile("./users.json", JSON.stringify(userdata), err => {});
}
function setMoney(person, amount) {
  moneies[person] = amount;
  fs.writeFile("./moneies.json", JSON.stringify(moneies), err => {});
}
function regularReward(channelID, userID, amount, time, property, unit, streakProperty) {
  var msg;
  if (moneies[userID] !== undefined) {
    var now = Date.now(),
    timeTilNext = userdata[userID][property] + time - now;
    if (timeTilNext <= 0) {
      setMoney(userID, moneies[userID] + amount);
      setMoney("bot", moneies.bot - amount);
      msg = `OK HERE IS YOUR **\`${amount}\`** MONEIES\n\n`;
      if (timeTilNext <= -time) {
        msg += `ALSO YOU BROKE YOUR STREAK OF ${userdata[userID][streakProperty]}`;
        userdata[userID][streakProperty] = 1;
      } else {
        userdata[userID][streakProperty]++;
        msg += `CURRENT STREAK: ${userdata[userID][streakProperty]}`;
      }
      updateUserData(userdata[userID][property] = now);
    } else {
      msg = `HEY HEY HEY IT HASN'T BEEN ${unit} YET YOU SILLY. JUST WAIT LIKE `;
      if (timeTilNext >= 3600000)
        msg += `${Math.floor(timeTilNext / 3600000) % 24} HOUR(S), `;
      if (timeTilNext >= 60000)
        msg += `${Math.floor(timeTilNext / 60000) % 60} MINUTE(S), `;
      msg += `${timeTilNext % 60000 / 1000} SECOND(S)`;
    }
  } else {
    msg = `PERHAPS YOU SHOULD TYPE \`I'M NEW\` FOR I AM NOT SURE WHO YOU ARE`;
  }
  bot.sendMessage({
    to: channelID,
    message: `<@${userID}> ${msg}`
  });
}

bot.on('ready', function(event) {
  console.log('Logged in as %s - %s\n', bot.username, bot.id);
});

bot.on('message', function(user, userID, channelID, message, event) {
  if (userID === bot.id) return;
  if (~message.indexOf(`<@${bot.id}>`) || ~message.indexOf(`<@!${bot.id}>`)) {
    var extraMessage = "";
    if (moneies[userID] !== undefined && Math.floor(Math.random() * 10) === 0) {
      var amount = Math.floor(Math.random() ** 4 * 180 + 10);
      setMoney(userID, moneies[userID] + amount);
      setMoney("bot", moneies.bot - amount);
      bot.sendMessage({
        to: channelID,
        message: `FINE <@${userID}> I'LL GIVE YOU ${amount} MONEIES TO GET YOU `
          + `TO SHUT UP.`
      });
    } else {
      bot.sendMessage({
        to: channelID,
        message: "HEY <@" + userID + "> DON'T MENTION ME I CAN'T ENGLISH YET"
      });
    }
  } else if (/\bhate\b/i.test(message)) {
    bot.sendMessage({
      to: channelID,
      message: "HEY <@" + userID + "> YOU SHOULD NOT BE HATING ON THINGS. HERE, I CAN FIX:```"
        + message.toUpperCase().replace(/HATE/g, "LOVE") + "```"
        + (moneies[userID] !== undefined && moneies[userID] >= 100
          ? (setMoney(userID, moneies[userID] - 100),
            setMoney("bot", moneies.bot + 100),
            "YOU GOT FINED 100 MONEIES")
          : "")
    });
  } else if (/\bwho\s+(are|r)\s+(you|u)\b/i.test(message)) {
    bot.sendMessage({
      to: channelID,
      message: "WELL I DON'T KNOW BUT I CERTAINLY DO KNOW YOU ARE "
        + user.toUpperCase() + ", <@" + userID + ">"
    });
  } else if (/\bmy\s+(moneies|money)\b/i.test(message)) {
    bot.sendMessage({
      to: channelID,
      message: moneies[userID] !== undefined ? `<@${userID}>, YOU HAVE **\`${moneies[userID]}\`** MONEY(S).`
        : `I DON'T KNOW <@${userID}>! ARE YOU NEW? (SAY \`I'M NEW\`)`
    });
  } else if (/\b(i'?m|i\s+am)\s+new\b/i.test(message)) {
    if (userdata[userID] === undefined) {
      createUser(userID);
      bot.sendMessage({
        to: channelID,
        message: `OK THEN, <@${userID}>. I WILL START YOU OFF WITH **__500__** MONEIES!`
      });
    } else {
      bot.sendMessage({
        to: channelID,
        message: `<@${userID}> LIESSSSS`
      });
    }
  } else if (/\btheir\s+(moneies|money)\b/i.test(message)) {
    var str = "";
    if (moneies.length === 0) str = "NO ONE HAS USED MONEY SYSTEM YET :(";
    else {
      for (let user in moneies) {
        if (user === "bot") continue;
        str += `<@${user}> HAS **\`${moneies[user]}\`** MONEIES\n`;
      }
      str += `AND I HAVE **\`${moneies.bot}\`** MONEIES! :D`;
    }
    bot.sendMessage({
      to: channelID,
      message: str
    });
  } else if (message.toLowerCase() === "gamble") {
    if (moneies[userID] !== undefined) {
      var amount = Math.floor(Math.random() * 11 - 5);
      if (amount < 0 && moneies[userID] < -amount) {
        setMoney("bot", moneies[userID]);
        setMoney(userID, 0);
        bot.sendMessage({
          to: channelID,
          message: `<@${userID}> JUST GAMBLED AWAY ALL THEIR MONEIES!\n\n...LOSER.`
        });
      } else {
        setMoney(userID, moneies[userID] + amount);
        setMoney("bot", moneies.bot - amount);
        bot.sendMessage({
          to: channelID,
          message: `<@${userID}> JUST ${amount < 0 ? "LOST" : "WON"} ${Math.abs(amount)} MONEY(S)!`
        });
      }
    } else {
      bot.sendMessage({
        to: channelID,
        message: `<@${userID}> YOU AREN'T USING THE MONEY SYSTEM; PLEASE TYPE \`I'M NEW\``
      });
    }
  } else if (/\bwhat\s+(should|do)\s+i\s+do\b/i.test(message)) {
    bot.sendMessage({
      to: channelID,
      message: `I RECOMMEND THAT YOU ANNOY ME:
      I RESPOND VIOLENTLY TO \`WHO ARE YOU\`, \`MY MONEIES\`, \`I'M NEW\`,
      \`THEIR MONEIES\`, \`GAMBLE\`, \`WHAT SHOULD I DO\`, \`GIVE 123 MONEIES TO @SOMEONE\`,
      \`ECHO "STRING"\`, \`HOURLY\`, \`DAILY\`, \`USE THIS CHANNEL\`, \`DEBUG L'TEST\`,
      \`RUN\`, \`HEY\`, \`ROB 123 MONEIES FROM @SOMEONE\`
      I GET TRIGGERED WHEN YOU MENTION ME OR USE THE WORD \`HATE\``
    });
  } else if (/\bhourly\b/i.test(message)) {
    regularReward(channelID, userID, 50, 3600000, "lastHourly", "AN HOUR", "hourlyStreak");
  } else if (/\bdaily\b/i.test(message)) {
    regularReward(channelID, userID, 500, 86400000, "lastDaily", "A DAY", "dailyStreak");
  } else if (/\buse\s+this\s+channel\b/i.test(message)) {
    tempChannel = channelID;
  } else if (message.toLowerCase() === "run") {
    for (var i = robbers.length; i--;) {
      if (robbers[i].robber === userID) {
        if (Date.now() - robbers[i].timestamp >= robbers[i].amount * 100) {
          robbers.splice(i, 1);
          bot.sendMessage({
            to: channelID,
            message: `<@${userID}> ESCAPED SUCCESSFULLY`
          });
        } else {
          bot.sendMessage({
            to: channelID,
            message: `<@${userID}> SORRY YOU'RE STILL STEALING MONEY. IT TAKES `
              + `TIME TO STEAL MONEY YOU KNOW. (10 moneies / s)`
          });
        }
      }
    }
  } else if (message.toLowerCase() === "hey") {
    if (robbers.length) {
      bot.sendMessage({
        to: channelID,
        message: `<@${userID}> CAUGHT ${robbers.length} ROBBER(S): `
          + robbers.map(r => `<@${r.robber}>`).join(", ")
          + `\n\nTHEY WILL RETURN THE STOLEN MONEY AND GIVE A THIRD OF THE `
          + `ROBBERS' MONEY TO THE SAVIOR`
      });
      robbers.map(r => {
        setMoney(r.robber, moneies[r.robber] - r.amount);
        setMoney(r.robbed, moneies[r.robbed] + r.amount);

        var punishment = Math.ceil(moneies[r.robber] / 3);
        setMoney(r.robber, moneies[r.robber] - punishment);
        setMoney(userID, moneies[userID] + punishment);
      });
      robbers = [];
    }
  } else {
    var giveMoneyRegex = /\bgive\s+([0-9]+)\s*(?:money|moneies)\s+to\s+<@!?([0-9]+)>/i,
    echoRegex = /\becho\s+(".*")(\s*-codeblock)*(\s*-external)*/i,
    debugRegex = /\bdebug\sl'\s?([a-z\-]+)/i,
    isNewRegex = /<@!?([0-9]+)>(?:'s|\s+is)\s+new\b/i,
    robRegex = /\b(?:rob|steal)\s+([0-9]+)\s+(?:money|moneies)\s+(?:from\s+|d'\s*)<@!?([0-9]+)>/i,
    theirUserid = /<@!?([0-9]+)> ?'?s\s+user\s*id\b/i;
    if (giveMoneyRegex.test(message)) {
      var exec = giveMoneyRegex.exec(message),
      amount = Math.min(+exec[1], moneies[userID]);
      if (moneies[exec[2]] === undefined) {
        bot.sendMessage({
          to: channelID,
          message: `HEY <@${userID}> YOUR USER, <@${exec[2]}>, HASN'T USED THE MONEY SYSTEM YET! HELP!!!!`
        });
      } else {
        setMoney(userID, moneies[userID] - amount);
        setMoney(exec[2], moneies[exec[2]] + amount);
        bot.sendMessage({
          to: channelID,
          message: "OK <@" + userID + ">."
        });
      }
    } else if (echoRegex.test(message)) {
      try {
        var exec = echoRegex.exec(message),
        str = JSON.parse(exec[1]);
        if (exec[2]) str = "```" + str + "```";
        if (exec[3] && !tempChannel) throw new Error("no set channel");
        bot.sendMessage({
          to: exec[3] ? tempChannel : channelID,
          message: str
        });
      } catch (e) {
        bot.sendMessage({
          to: channelID,
          message: `HEY <@${userID}> I THINK YOU BROKE:` + "```" + e.toString().toUpperCase() + "```"
        });
      }
    } else if (debugRegex.test(message)) {
      var response = "not sure how to do that";
      switch (debugRegex.exec(message)[1]) {
        case "mi-userid":
          response = userID;
          break;
        case "test":
          response = "omni salut l'democraze";
          break;
        case "repos":
          response = "https://github.com/Orbiit/moofy-bot";
          break;
        case "invite":
          response = "https://discordapp.com/oauth2/authorize?client_id=393248490739859458&scope=bot";
          break;
      }
      bot.sendMessage({
        to: channelID,
        message: `<@${userID}>\`\`\`css\n${response.toUpperCase()}\`\`\``
      });
    } else if (isNewRegex.test(message)) {
      var user = isNewRegex.exec(message)[1];
      if (userdata[user] === undefined) {
        createUser(user);
        bot.sendMessage({
          to: channelID,
          message: `<@${userID}> THANKS FOR LETTING ME K'NOW`
        });
      } else {
        bot.sendMessage({
          to: channelID,
          message: `<@${userID}> I DON'T THINK SOOOO`
        });
      }
    } else if (robRegex.test(message)) {
      var exec = robRegex.exec(message),
      amount = +exec[1],
      user = exec[2];
      if (moneies[userID] === undefined) {
        bot.sendMessage({
          to: channelID,
          message: `<@${userID}> THEY DON'T HAVE A MONEY ACCOUNT`
        });
      } else if (amount > 1000 || amount < 0 || amount > moneies[user]) {
        bot.sendMessage({
          to: channelID,
          message: `SORRY <@${userID}> I CAN'T WORK WITH THAT AMOUNT`
        });
      } else {
        setMoney(user, moneies[user] - amount);
        setMoney(userID, moneies[userID] + amount);
        robbers.push({
          robber: userID,
          robbed: user,
          amount: amount,
          timestamp: Date.now()
        });
        bot.sendMessage({
          to: channelID,
          message: `(<@${userID}> OK - SAY \`RUN\` TO AVOID GETTING CAUGHT)`
            + `\n\n**<@${userID}> STOLE FROM SOMEONE ELSE. SAY \`HEY\` FOR A REWARD.**`
        });
      }
    } else if (theirUserid.test(message)) {
      var user = theirUserid.exec(message)[1];
      bot.sendMessage({
        to: channelID,
        message: `<@${userID}> THEIR USER ID IS... \`${user}\`!`
      });
    }
  }
});
