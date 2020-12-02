const parse = require('./parse');

const main = async () => {
    const { title, content } = await parse(
        'https://www.douban.com/note/785911942/'
    );
    console.log('result is: ', title, content);
};

main();
