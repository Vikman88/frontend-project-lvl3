import axios from 'axios';

const variables = 'https://hexlet-allorigins.herokuapp.com';

const makeProxyUrl = (source) => {
  const newURL = new URL('/get', variables);
  newURL.searchParams.set('url', source);
  newURL.searchParams.set('disableCache', 'true');
  return newURL.toString();
};

const fetchData = (source) => {
  const proxyURL = makeProxyUrl(source);
  return axios.get(proxyURL);
};

export default fetchData;
