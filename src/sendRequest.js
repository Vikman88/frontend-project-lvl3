import axios from 'axios';

const variables = {
  proxy: () => 'https://hexlet-allorigins.herokuapp.com',
};

const getRequest = (url) => {
  const makedURL = new URL('/get', variables.proxy());
  makedURL.searchParams.set('url', url);
  makedURL.searchParams.set('disableCache', 'true');
  return axios.get(makedURL.toString());
};

export default getRequest;
