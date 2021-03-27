import second from './second.js';

console.log(second());
console.log('works');

const start = async () => {
  await Promise.resolve('async is working');
};

start().then(console.log);
