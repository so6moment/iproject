require('dotenv').config();
const {
  Bot,
  Keyboard,
  InlineKeyboard,
  GrammyError,
  HttpError,
} = require('grammy');
const { getRandomQuestion, getCorrectAnswer } = require('./utils');

const bot = new Bot(process.env.BOT_API_KEY);

bot.command('start', async (ctx) => {
  const startKeyboard = new Keyboard()
    .text('First')
    .text('Second')
    .row()
    .text('Third')
    .resized();
  await ctx.reply(
    'Привет👋\nЯ помогу тебе выучить неправильные глаголы английского языка🇬🇧',);
  await ctx.reply('Выбери, какой уровень тебя интересует👇\n\n1️⃣Первый уровень подойдёт для начального знакомства с неправильными глаголами. Ваша задача - выбрать правильный перевод Английскому глаголу.\n\n2️⃣Второй уровень ставит задачу подобрать 3 формы глагола на английском языке к русскому переводу.\n\n3️⃣Третий уровень знакомит с неправильными глаголами повышенной сложности. Метод отработки идентичен первому уровню - выбрать правильный перевод Английскому глаголу.', {
    reply_markup: startKeyboard,
  });
});

bot.hears(
  ['First', 'Second', 'Third'],
  async (ctx) => {
    const topic = ctx.message.text.toLowerCase();
    const { question, questionTopic } = getRandomQuestion(topic);

    let inlineKeyboard;

    if (question.hasOptions) {
      const buttonRows = question.options.map((option) => [
        InlineKeyboard.text(
          option.text,
          JSON.stringify({
            type: `${questionTopic}-option`,
            isCorrect: option.isCorrect,
            questionId: question.id,
          }),
        ),
      ]);

      inlineKeyboard = InlineKeyboard.from(buttonRows);
    } 

    await ctx.reply(question.text, {
      reply_markup: inlineKeyboard,
    });
  },
);

bot.on('callback_query:data', async (ctx) => {
  const callbackData = JSON.parse(ctx.callbackQuery.data);

  if (!callbackData.type.includes('option')) {
    const answer = getCorrectAnswer(callbackData.type, callbackData.questionId);
    await ctx.reply(answer, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
    await ctx.answerCallbackQuery();
    return;
  }

  if (callbackData.isCorrect) {
    await ctx.reply('Верно');
    await ctx.answerCallbackQuery();
    return;
  }

  const answer = getCorrectAnswer(
    callbackData.type.split('-')[0],
    callbackData.questionId,
  );
  await ctx.reply(`Неверно. Правильный ответ: ${answer}`);
  await ctx.answerCallbackQuery();
});

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error('Error in request:', e.description);
  } else if (e instanceof HttpError) {
    console.error('Could not contact Telegram:', e);
  } else {
    console.error('Unknown error:', e);
  }
});

bot.start();