const yup = require('yup');
const axios = require('axios');
import render from './second.js';

const variables = {
  proxy: () => 'https://hexlet-allorigins.herokuapp.com/raw?url=',
  goodStatus: () => 200,
};
const messages = {
  empty: () => 'Поле не заполнено',
  invalid: () => 'Ссылка должна быть валидным URL',
  dublicate: () => 'RSS уже существует',
  invalidRssUrl: () => 'Ресурс не содержит валидный RSS',
  networkError: () => 'Ошибка сети',
  success: () => 'RSS успешно загружен',
};

const validate = (url, listUrls) => {
  const shema = yup
    .string()
    .trim()
    .required(messages.empty())
    .url(messages.invalid())
    .notOneOf(listUrls, messages.dublicate());
  try {
    shema.validateSync(url);
    return null;
  } catch (error) {
    return error.message;
  }
};

const getChildElements = (el) => {
  const title = el.querySelector('title');
  const link = el.querySelector('link');
  const description = el.querySelector('description');
  const result = { title, link, description };
  return result;
};

const parsData = (data) => {
  const items = data.querySelectorAll('item');
  const itemsElToArr = Array.from(items).reduce(
    (acc, item) => [...acc, getChildElements(item)],
    []
  );
  const result = { ...getChildElements(data), items: itemsElToArr };
  return result;
};

const getRequest = (url) => {
  const promise = axios
    .get(`${variables.proxy()}${encodeURIComponent(url)}`)
    .then((response) => response)
    .catch((error) => error);
  return promise;
};

export default () => {
  const elements = {
    input: document.querySelector('input'),
    form: document.querySelector('form'),
    feedbackForm: document.querySelector('.feedback'),
    button: document.querySelector('[type="submit"]'),
    feeds: document.querySelector('.feeds'),
    posts: document.querySelector('.posts'),
  };

  const state = {
    form: {
      status: 'filling',
      urls: [],
      field: {
        error: null,
        valid: true,
      },
    },
    posts: [],
    messageAlert: null,
  };

  const watchedState = render(state, elements);

  const form = elements.form;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const listUrls = state.form.urls;
    const formData = new FormData(e.target);
    const url = formData.get('url');
    const error = validate(url, listUrls);
    if (error) {
      watchedState.form.field = {
        error,
        valid: false,
      };
      return;
    }
    watchedState.form.field = {
      error,
      valid: true,
    };
    watchedState.messageAlert = null;
    watchedState.form.urls.push(url);
    watchedState.form.status = 'sending';
    getRequest(url).then((response) => {
      console.log(response.message, response.status, response);
      const { responseXML } = response.request;
      const status = response.status;
      console.log(status);
      if (!responseXML) {
        watchedState.messageAlert =
          status === variables.goodStatus()
            ? messages.invalidRssUrl()
            : messages.networkError();
        watchedState.form.status = 'failed';
        watchedState.form.urls.pop();
        return;
      }
      const parsedPosts = parsData(responseXML);
      watchedState.posts.push(parsedPosts);
      watchedState.messageAlert = messages.success();
      watchedState.form.status = 'rendering';
    });
    watchedState.form.status = 'filling'; //??
  });
};
