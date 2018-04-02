var Discord = require('discord.io');
var Token = require('./token.json');
var fs = require('fs');
var bot = new Discord.Client({
  autorun: true,
  token: Token.token
});
var moneies,
userdata;

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
    }
    userdata[user].version = 2;
  }
  updateUserData();
});

function updateUserData() {
  fs.writeFile("./users.json", JSON.stringify(userdata), err => {});
}
function setMoney(person, amount) {
  moneies[person] = amount;
  fs.writeFile("./moneies.json", JSON.stringify(moneies), err => {});
}
function regularReward(channelID, userID, amount, time, property, unit) {
  var msg;
  if (moneies[userID] !== undefined) {
    var now = Date.now(),
    timeTilNext = userdata[userID][property] + time - now;;
    if (timeTilNext <= 0) {
      setMoney(userID, moneies[userID] + amount);
      msg = `OK HERE IS YOUR **\`${amount}\`** MONEIES`;
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
          ? (setMoney(userID, moneies[userID] - 100), "YOU GOT FINED 100 MONEIES") : "")
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
      setMoney(userID, 500);
      updateUserData(userdata[userID] = {
        version: 2,
        lastHourly: 0,
        lastDaily: 0
      });
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
        str += `<@${user}> HAS **\`${moneies[user]}\`** MONEIES\n`;
      }
    }
    bot.sendMessage({
      to: channelID,
      message: str
    });
  } else if (message.toLowerCase() === "gamble") {
    if (moneies[userID] !== undefined) {
      var amount = Math.floor(Math.random() * 11 - 5);
      setMoney(userID, moneies[userID] + amount);
      bot.sendMessage({
        to: channelID,
        message: `<@${userID}> JUST ${amount < 0 ? "LOST" : "WON"} ${Math.abs(amount)} MONEY(S)!`
      });
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
      AND \`ECHO "STRING"\`
      I GET TRIGGERED WHEN YOU MENTION ME OR USE THE WORD \`HATE\``
    });
  } else if (/\bhourly\b/i.test(message)) {
    regularReward(channelID, userID, 50, 3600000, "lastHourly", "AN HOUR");
  } else if (/\bdaily\b/i.test(message)) {
    regularReward(channelID, userID, 500, 86400000, "lastDaily", "A DAY");
  } else {
    var giveMoneyRegex = /\bgive\s+([0-9]+)\s*(?:money|moneies)\s+to\s+<@([0-9]+)>\b/i,
    echoRegex = /\becho\s+(".*")(\s*-codeblock)*/i;
    if (giveMoneyRegex.test(message)) {
      var exec = giveMoneyRegex.exec(message),
      amount = Math.min(+exec[1], moneies[userID]);
      if (moneies[exec[2]] === undefined) {
        bot.sendMessage({
          to: channelID,
          message: `HEY <@${userID}> YOUR USER, <@${exec[2]}>, HASN'T USED ! HELP!!!!`
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
        bot.sendMessage({
          to: channelID,
          message: str
        });
      } catch (e) {
        bot.sendMessage({
          to: channelID,
          message: `HEY <@${userID}> I THINK YOU BROKE:` + "```" + e + "```"
        });
      }
    }
  }
});
