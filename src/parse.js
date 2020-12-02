const Mercury = require('@postlight/mercury-parser');
const sanitizeHtml = require('sanitize-html');
const url = require('url');
const logger = require('./logger');
const mercury = require('./mercury');
const fixImages = require('./fixImages');
const puppetFunc = require('./puppet');

// 适配某些自动分析分析不出来的网站。
const getExtractor = () => {
    return null;
};

const puppet = async (link) => {
    let l = link;

    let html = '';
    html = await puppetFunc(l);
    return html;
};

module.exports = parse = async (userUrl) => {
    const extractor = getExtractor();
    if (extractor) {
        Mercury.addExtractor(extractor);
    }

    let result = await mercury(userUrl);
    logger(result.content, 'mercury.html');
    let { content } = result;
    const preContent = sanitizeHtml(content).trim();
    logger(preContent, 'preContent.html');
    if (preContent.length === 0) {
        const html = await puppet(userUrl);
        if (html) {
            result = await mercury(userUrl, { html: Buffer.from(html) });
            logger(result.content, 'mercuryAsyncContent.html');
        }
    }
    let { title = '', url: source, iframe } = result;
    if (iframe) logger(iframe, 'iframes.html');
    content = result.content;
    if (content) {
        content = await fixImages.fixHtml(
            content,
            iframe,
            url.parse(userUrl),
            {}
        );
        logger(content, 'tg_content.html');
        logger(`after san ${content.length}`);
    }
    title = title && title.trim();
    title = title || 'Untitled article';
    const res = {
        title,
        content,
        source,
    };

    return res;
};
