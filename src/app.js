import * as yup from 'yup';
import axios from 'axios';
import i18n from 'i18next';
import crc32 from 'crc-32';
import render from './render.js';
import resources from './locales';

const variables = {
  proxy: () => 'https://hexlet-allorigins.herokuapp.com',
  goodStatus: () => 200,
  interval: () => 5000,
};
const alertPaths = {
  empty: () => 'form.messageAlert.empty',
  invalid: () => 'form.messageAlert.invalid',
  dublicate: () => 'form.messageAlert.dublicate',
  invalidRssUrl: () => 'networkAlert.invalidRssUrl',
  networkError: () => 'networkAlert.networkError',
  success: () => 'networkAlert.success',
};

const toResponseXML = (response) => {
  const parserXML = new DOMParser();
  const xmlContent = response.data.contents;
  const responseXML = parserXML.parseFromString(xmlContent, 'text/xml');
  const rss = responseXML.querySelector('rss');
  console.log(rss);
  if (!rss) throw new Error('Страница не найдена');
  return responseXML;
};

const hashCode = (string) => {
  const hash = crc32.str(string);
  return hash;
};

const validate = (url, listUrls) => {
  const shema = yup.string()
    .trim()
    .required()
    .url()
    .notOneOf(listUrls);
  try {
    shema.validateSync(url);
    return null;
  } catch (error) {
    return error.message;
  }
};

const updateCollection = (responsePosts, loadedPosts, state) => {
  const loadedPostIds = loadedPosts.map(({ id }) => id);
  if (loadedPostIds.includes(responsePosts.id)) {
    const index = loadedPostIds.indexOf(responsePosts.id);
    const findedField = loadedPosts[index];
    const findedItems = findedField.items;
    const findedIds = findedItems.map(({ id }) => id);
    const targetItems = responsePosts.items;
    const updatedItems = targetItems.reduce((acc, v) => {
      const currentId = v.id;
      if (!findedIds.includes(currentId)) acc.push(v);
      return acc;
    }, []);
    state[index].items.unshift(...updatedItems);
  } else state.push(responsePosts);
};

const touchElements = (collection, currentId) => {
  collection.forEach((feed) => {
    feed.items.forEach((post) => {
      const { id } = post;
      const item = post;
      if (id === parseInt(currentId, 10)) item.touched = true;
    });
  });
};

const getChildElements = (el) => {
  const title = el.querySelector('title').textContent;
  const link = el.querySelector('link').textContent;
  const description = el.querySelector('description').textContent;
  const id = hashCode(title);
  const result = {
    title,
    link,
    description,
    id,
  };
  return result;
};

const parsData = (data) => {
  const itemsCollection = data.querySelectorAll('item');
  const items = Array.from(itemsCollection).reduce((acc, item) => {
    const childElements = getChildElements(item);
    childElements.touched = false;
    return [...acc, childElements];
  }, []);
  const result = { ...getChildElements(data), items };
  return result;
};

const getRequest = (url) => {
  const makeUrl = new URL('get', 'https://hexlet-allorigins.herokuapp.com');
  makeUrl.searchParams.set('url', url);
  makeUrl.searchParams.set('disableCache', 'true');
  return axios.get(makeUrl);
};

export default () => {
  i18n
    .init({
      lng: 'ru',
      debug: false,
      resources,
    })
    .then(() => {
      yup.setLocale({
        mixed: {
          required: i18n.t(alertPaths.empty()),
          notOneOf: i18n.t(alertPaths.dublicate()),
        },
        string: {
          url: i18n.t(alertPaths.invalid()),
        },
      });

      const elements = {
        input: document.querySelector('input'),
        form: document.querySelector('form'),
        feedbackForm: document.querySelector('.feedback'),
        button: document.querySelector('[type="submit"]'),
        feedsField: document.querySelector('.feeds'),
        postsField: document.querySelector('.posts'),
        modalHead: document.querySelector('.modal-header'),
        modalBody: document.querySelector('.modal-body'),
        modalFooter: document.querySelector('.modal-footer'),
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
        networkAlert: null,
      };

      const watchedState = render(state, elements);

      const { form } = elements;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const listUrls = state.form.urls;
        const formData = new FormData(e.target);
        const responseUrl = formData.get('url');
        const error = validate(responseUrl, listUrls);
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
        watchedState.networkAlert = null;
        watchedState.form.status = 'sending';
        getRequest(responseUrl).then((response) => {
          console.log(response);
          const responseXML = toResponseXML(response);
          if (!responseXML) {
            throw new Error(i18n.t(alertPaths.invalidRssUrl()));
          }
          watchedState.form.urls.push(responseUrl);
          watchedState.networkAlert = i18n.t(alertPaths.success());
          watchedState.form.status = 'rendering';
        }).then(() => {
          const rerender = (urls) => urls.forEach((url) => {
            getRequest(url).then((response) => {
              const responseXML = toResponseXML(response);
              const parsedPosts = parsData(responseXML);
              updateCollection(parsedPosts, state.posts, watchedState.posts);
            });
          });

          const eternal = () => {
            watchedState.form.status = 'filling';
            rerender(state.form.urls);
            watchedState.form.status = 'updating';
            elements.postsField.addEventListener('click', (val) => {
              const { target } = val;
              const { id } = target.dataset;
              touchElements(watchedState.posts, id);
            });
            setTimeout(eternal, variables.interval());
          };
          setTimeout(eternal, 100);
        }).catch((errors) => {
          if (errors.message === 'Страница не найдена') {
            watchedState.networkAlert = i18n.t(alertPaths.invalidRssUrl());
          } else watchedState.networkAlert = i18n.t(alertPaths.networkError());
          watchedState.form.status = 'failed';
          watchedState.form.urls.pop();
        });
      });
    });
};
