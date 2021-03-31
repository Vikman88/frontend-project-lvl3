const yup = require('yup');
const axios = require('axios');
import render from './second.js';

const messages = {
  empty: () => 'Поле не заполнено',
  invalid: () => 'Ссылка должна быть валидным URL',
  dublicate: () => 'RSS уже существует',
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

const getResult = (url, state) => {
  axios
    .get(url)
    .then((response) => parsData(response.request.responseXML))
    .then((feeds) => state.posts.push(feeds))
    .catch((error) => console.log(error)); // допилить в случае ошибки
};

export default () => {
  const elements = {
    input: document.querySelector('input'),
    form: document.querySelector('form'),
    feedbackForm: document.querySelector('.feedback'),
    button: document.querySelector('[type="submit"]'),
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
    error: null,
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
    watchedState.form.urls.push(url);
    try {
      watchedState.form.status = 'sending';
      watchedState.error = null;
      const result = getResult(url, watchedState); //поменять название
      console.log(111112);
    } catch (error) {
      watchedState.form.status = 'failed';
      watchedState.form.urls.pop();
      watchedState = error.message; //организовать обработку ошибок
    }
  });
};
