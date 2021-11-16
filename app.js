const dotenv = require('dotenv');
dotenv.config();

const { App } = require('@slack/bolt');
const Keyv = require('keyv');
/**
 * DB SETUP
 */
// using the basic in-memory one below
const keyv = new Keyv();
// Handle DB connection errors
// keyv.on('error', err => console.log('Connection Error', err));

/**
 * CREATE CUSTOM RECEIVER
 */
// const receiver = new ExpressReceiver({
//   signingSecret: process.env.SLACK_SIGNING_SECRET
// });

/**
 * CREATE BOLT APP
 */
const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: 'boxil-slack-app',
  scopes: [
    'channels:history',
    'channels:read',
    'chat:write',
    'groups:history',
    'groups:read',
    'im:history',
    'im:read',
    'mpim:history',
    'mpim:read'
  ],
  installationStore: {
    storeInstallation: async (installation) => {
      // Debug FIX ME
      console.info(`[info] team_id: ${installation.team.id}`);
      console.info(`[info] token_type: ${installation.tokenType}`);
      console.info(`[info] bot token: ${installation.bot.token}`);
      console.info(`[info] user token: ${installation.user.token}`);

      // 実際のデータベースに保存するために、ここのコードを変更
      if (installation.isEnterpriseInstall && installation.enterprise !== undefined) {
        // OrG 全体へのインストールに対応する場合
        return await keyv.set(installation.enterprise.id, installation);
      }
      if (installation.team !== undefined) {
        // 単独のワークスペースへのインストールの場合
        return await keyv.set(installation.team.id, installation);
      }
      throw new Error('Failed saving installation data to installationStore');
    },
    fetchInstallation: async (installQuery) => {
      // 実際のデータベースから取得するために、ここのコードを変更
      if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
        // OrG 全体へのインストール情報の参照
        return await keyv.get(installQuery.enterpriseId);
      }
      if (installQuery.teamId !== undefined) {
        // 単独のワークスペースへのインストール情報の参照
        return await keyv.get(installQuery.teamId);
      }
      throw new Error('Failed fetching installation');
    },
    deleteInstallation: async (installQuery) => {
      // 実際のデータベースから削除するために、ここのコードを変更
      if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
        // OrG 全体へのインストール情報の削除
        return await keyv.delete(installQuery.enterpriseId);
      }
      if (installQuery.teamId !== undefined) {
        // 単独のワークスペースへのインストール情報の削除
        return await keyv.delete(installQuery.teamId);
      }
      throw new Error('Failed to delete installation');
    },
  },
});

// Listens to incoming messages that contain "hello"
app.message("hello", async ({ message, say, body }) => {
  // say() sends a message to the channel where the event was triggered
  say(`Hey there <@${message.user}>!`);
});

/**
 * START APP
 */
(async () => {
  // Start your app
  await app.start(Number(process.env.PORT) || 3000);
  console.log("⚡️ Bolt app is running!");
})();