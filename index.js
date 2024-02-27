import fetch from 'node-fetch';
import TelegramBot from 'node-telegram-bot-api';

import dotenv from 'dotenv';

dotenv.config()

// Type definition for user input
const userInput = {};


// Retrieve BOT_TOKEN from environment variables
const botToken = process.env.BOT_TOKEN;
//console.log(botToken)
if (!botToken) {
  console.error('Bot token not provided. Please set the BOT_TOKEN environment variable.');
  process.exit(1);
}

// Create a new Telegram bot instance
const bot = new TelegramBot(botToken, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `👋 Welcome to PositionSize Master Bot! 📈\n\n`;
  const instructionMessage = `To get started, use the following commands:\n\n`;
  const commandsList = [
    '/positionsize 📊 - Calculate position size based on entry, stop loss, and risk.',
    '/help ℹ️ - Get assistance and explore available commands.',
    '/commands 📜 - View the list of commands at any time.',
  ];

  const fullMessage = welcomeMessage + instructionMessage + commandsList.join('\n');

  bot.sendMessage(chatId, fullMessage);
});


// Function to calculate position size
function calculatePositionSize(riskAmount, percentageDistanceToStopLoss) {
  // Assuming a simple formula for position size: risk amount divided by percentage distance
  return parseFloat((riskAmount / percentageDistanceToStopLoss).toFixed(2));
}

// Function to handle user input and perform calculations
async function handleUserInput(chatId, text) {
  if (text === '/positionsize') {
    await bot.sendMessage(chatId, 'Enter entry price:');
    userInput[chatId] = { step: 'entryPrice' };
  } else if (userInput[chatId]?.step === 'entryPrice') {
    const entryPrice = parseFloat(text);

    if (isNaN(entryPrice)) {
      await bot.sendMessage(chatId, 'Invalid entry price. Please enter a valid number.');
      return;
    }

    userInput[chatId].entryPrice = entryPrice;
    await bot.sendMessage(chatId, 'Enter stop loss:');
    userInput[chatId].step = 'stopLoss';
  } else if (userInput[chatId]?.step === 'stopLoss') {
    const stopLoss = parseFloat(text);

    if (isNaN(stopLoss)) {
      await bot.sendMessage(chatId, 'Invalid stop loss. Please enter a valid number.');
      return;
    }

    userInput[chatId].stopLoss = stopLoss;
    await bot.sendMessage(chatId, 'Enter risk amount:');
    userInput[chatId].step = 'riskAmount';
  } else if (userInput[chatId]?.step === 'riskAmount') {
    const riskAmount = parseFloat(text);

    if (isNaN(riskAmount)) {
      await bot.sendMessage(chatId, 'Invalid risk amount. Please enter a valid number.');
      return;
    }

    userInput[chatId].riskAmount = riskAmount;

    // Determine position type based on price difference
    const priceDifference = userInput[chatId].entryPrice - userInput[chatId].stopLoss;
    userInput[chatId].positionType = priceDifference < 0 ? 'short' : 'long';

    // Calculate percentage distance using absolute value of price difference
    const percentageDistanceToStopLoss = Math.abs(priceDifference / userInput[chatId].entryPrice) * 100;
   console.log({percentageDistanceToStopLoss})
    // Perform the position size calculation directly
    const positionSize = calculatePositionSize(userInput[chatId].riskAmount, percentageDistanceToStopLoss / 100);

    // Include entry price, stop loss, and risk amount in the response
    const responseMessage = `Entry Price: ${userInput[chatId].entryPrice}\nStop Loss: ${userInput[chatId].stopLoss}\nRisk Amount: ${userInput[chatId].riskAmount}\nPosition Type: ${userInput[chatId].positionType}\nPosition Size: ${positionSize}`;

    // Send the response with type definition
    const response = {
      chat_id: chatId,
      text: responseMessage
    };

    await bot.sendMessage(response.chat_id, response.text);

    // Clear user input after calculation
    delete userInput[chatId];
  }
}

// Listen for incoming messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || '';

  // Handle user input and perform calculations
  await handleUserInput(chatId, text);
});

