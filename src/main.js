const dotenv = require('dotenv-safe');
const WebSocketClient = require('websocket').client;
const client = new WebSocketClient();
const urlParse = require('url').parse;
const parse = require('./parse');
const makeTelegraph = require('./makeTelegraph');
const { JSDOM } = require('jsdom');

let domain = '';
let telegraphToken = '';
let mastodonToken = '';
let whiteList = [];

const init = () => {
    dotenv.config({
        allowEmptyValues: true,
        path: path.join(__dirname, '../.env'),
        sample: path.join(__dirname, '../.env.example'),
    });
    domain = process.env.DOMAIN;
    telegraphToken = process.env.TELEGRAPH_TOKEN;
    mastodonToken = process.env.MASTODON_TOKEN;

    // 白名单转换成数组
    if (process.env.WHITELIST) {
        whiteList = process.env.WHITELIST.split(' ');
    }
};

const archive = async (link) => {
    const { title, content } = await parse(link);

    const { telegraphLink, isLong, pages, push } = await makeTelegraph(
        {
            title,
            author_url: 'https://telegra.ph/api#createAccount',
            access_token: telegraphToken,
        },
        content
    );
    console.log(telegraphLink, isLong, pages, push);
    return telegraphLink;
};

// 接收实例数据流
const listen = () => {
    client.on('connectFailed', function (error) {
        console.log('Connect Error: ' + error.toString());
        process.exit(1);
    });

    client.on('connect', function (connection) {
        console.log('WS Conntection Success!');
        connection.on('error', function (error) {
            console.log('Connection Error: ' + error.toString());
            process.exit(1);
        });
        connection.on('close', function () {
            console.log('echo-protocol Connection Closed');
            process.exit(1);
        });
        connection.on('message', function (message) {
            if (message.type === 'utf8') {
                const data = JSON.parse(message.utf8Data);
                if (data.event !== 'update') return;
                const status = JSON.parse(data.payload);

                // if(status.account.username === 'beifen') return

                const { window } = new JSDOM(
                    `<!DOCTYPE html>${status.content}`
                );
                const $ = require('jquery')(window);

                $('a').each(async () => {
                    const link = $(this).text();
                    const { host, hostname } = urlParse(link);
                    // 如果用户发出的链接是当前实例的 或者 域名不在白名单的，不备份
                    if (hostname === domain || !whiteList.includes(hostname)) {
                        return;
                    }
                    console.log('link host,hostname', host, hostname);
                    const telegraphLink = await archive(link);
                    console.log(
                        'telegraphLink2',
                        telegraphLink,
                        ' ',
                        status.id
                    );
                });
            }
        });
    });

    client.connect(
        'wss://' + domain + '/api/v1/streaming/?stream=public:local'
    );
};

init();
main();

const main = async () => {};
