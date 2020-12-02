const Mercury = require('@postlight/mercury-parser');

const url =
    'https://www.douban.com/review/9929565/?dt_dapp=1';
Mercury.parse(url).then((result) => console.log(result));
