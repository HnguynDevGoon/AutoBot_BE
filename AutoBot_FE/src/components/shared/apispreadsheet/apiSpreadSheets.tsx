const apispreadsheets = 'https://opensheet.elk.sh/1RgQmIZzP2CjsF1AG8LQp8We1R9CtsR3voLMlwWhtDWM';

const imgFromDriveUrl = (url: string) => url.replace('file/d/', 'thumbnail?id=').replace('/view?usp=sharing', '&sz=w2000');

export {apispreadsheets, imgFromDriveUrl};