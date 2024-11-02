import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import path from "path";
import os from "os";
import "dotenv/config";

const log = console.log;

// Replace with your bot token
const BOT_TOKEN = process.env.BOT_TOKEN;

// Set the directory to save files
const SAVE_FOLDER = path.join(os.homedir(), "Telegram", "save-to-local");

console.log(SAVE_FOLDER);

if (fs.existsSync(SAVE_FOLDER) != true) {
  fs.mkdirSync(SAVE_FOLDER);
}

if (BOT_TOKEN == null) process.exit(1);

// // Initialize the bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// // Start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `
        Welcome to the Telegram Bot!
        Send me a audio or voice message to save it locally on your Server.
        i've created a folder in your home directory to save the files and save them in the ${SAVE_FOLDER}.
        I can not save files bigger 20 MB.
    `
  );
});

// // Handle incoming files
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  log("msg", msg);
  // Check if there is a document or audio file
  const file = msg.document || msg.audio || msg.voice;
  log("file", file);

  if (file) {
    const fileId = file.file_id;
    let fileName;

    if ("file_name" in file) {
      fileName = file.file_name;
    } else {
      fileName = `${fileId}.dat`;
    }

    const filePath = path.join(SAVE_FOLDER, fileName!);
    log("filePath", filePath);

    try {
      // Get the file URL and download it
      const fileLink = await bot.getFileLink(fileId);
      log("fileLink", fileLink);

      const fileStream = fs.createWriteStream(filePath);
      log("fileStream", fileStream);

      // Download the file and save it
      bot.getFileStream(fileId).pipe(fileStream);
      fileStream.on("finish", () => {
        bot.sendMessage(fileName!, `File saved to: ${filePath}`);
      });
    } catch (error) {
      console.error("Error downloading file:", (error as Error).message);
      bot.sendMessage(
        `${fileName!} with this id: ${chatId}`,
        `Failed to download and save the file.: ${(error as Error).message}`
      );
    }
  }
});
