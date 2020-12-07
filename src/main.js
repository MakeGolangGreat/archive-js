const WebSocketClient = require('websocket').client;
const client = new WebSocketClient();
const urlParse = require('url').parse;
const parse = require('./parse');
const makeTelegraph = require('./makeTelegraph');
const { JSDOM }  = require('jsdom');

const main = async () => {
    const { title, content } = await parse(
        'https://www.douban.com/note/785911942/'
    );
    // console.log('result is: ', title, content);

    const { telegraphLink, isLong, pages, push } =  await makeTelegraph({
        title,
        author_url: 'https://telegra.ph/api#createAccount',
        access_token: '2cec0afb49ed4706164bea7e795f45ff71160e68d6e01670477c0762d4b8'
    },content)

    console.log(telegraphLink,isLong,pages,push)
};

// main();

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
    process.exit(1)
});

client.on('connect', function(connection) {
    console.log("WS Conntection Success!")
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
        process.exit(1)
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
        process.exit(1)
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            const data = JSON.parse(message.utf8Data)
            if(data.event !== 'update') return

            const status = JSON.parse(data.payload)
            const {host,hostname} = urlParse(status.account.url)
            console.log("toot host,hostname: ",host,hostname)
            // if(status.account.username === 'beifen') return

            const { window } = new JSDOM(`<!DOCTYPE html>${status.content}`);
            const $ = require( "jquery" )( window );

            $('a').each(()=>{
                const link = $(this).text();
                const {host,hostname} = urlParse(link)
                console.log("link",host,hostname)
            })
        }
    });
});

client.connect("wss://" + "alive.bar" + "/api/v1/streaming/?stream=public:local");
console.log(2)