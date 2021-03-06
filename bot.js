const TeleBot  = require('telebot');
const config   = require('./config');
const mongoose = require('mongoose');
mongoose.connect('localhost/etsiit');

const bot       = new TeleBot(config.TOKEN);
const User      = require('./models/user');
const preguntas = require('./preguntas');

const getRandom = (arr, n) => {
    let result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        let x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len;
    }
    return result;
};

bot.on('text', (msg) => {

});

bot.on(['/start', '/hello'], (msg) => {
    msg.reply.text('Hola!');
});

bot.on(['newChatMembers'], async (msg) => {
    try {
        let user = new User({
            username: msg.new_chat_member.username,
            userId  : msg.new_chat_member.id
        });
        await user.save();
        msg.reply.text('Ha entrado un nuevo miembro');
        let array = getRandom(preguntas,3);
        msg.reply.text(array[0] + '\n' + array[1] + '\n' + array[2]);
    } catch (err) {
        if (err.code === 11000) {
            let u     = await User.findOne({username: msg.new_chat_member.username});
            u.advices = 0;
            await u.save();
            msg.reply.text('Ha entrado un viejo miembro de nuevo');
        } else {
            throw err;
        }
    }
});

bot.on(['/aviso'], async (msg) => {
    try {
        let user = msg.text.split(' ')[1];
        if (user.includes('@')) user = user.split('@')[1];
        let u = await User.findOne({username: user});
        if (u) {
            user = u;
            user.advices++;
            await user.save();
            if (user.advices >= 3) {
                await bot.kickChatMember(msg.chat.id, user.userId);
                msg.reply.text(user.username + ' ha sido expulsado');
                bot.sendVideo(msg.chat.id, 'https://media.giphy.com/media/jkKcgtQcrAvks/giphy.gif');
            } else {
                msg.reply.text(user.username + ' tiene ' + user.advices + ' avisos');
            }
        } else {
            msg.reply.text(user.username + ' no encontrado');
        }
    } catch (err) {
        throw err;
    }
});

bot.start();