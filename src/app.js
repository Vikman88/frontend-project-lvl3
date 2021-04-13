import * as yup from 'yup';
import i18next from 'i18next';
import crc32 from 'crc-32';
import render from './render.js';
import resources from './locales';
import validate from './validator';
import getRequest from './sendRequest';

const variables = {
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
  return responseXML;
};

const hashCode = (string) => {
  const hash = crc32.str(string);
  return hash;
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

export default () => {
  const i18n = i18next.createInstance();
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
        message: null,
        valid: true,
      },
    },
    posts: [],
    currentId: null,
  };

  const watchedState = render(state, elements, i18n);

  const { form } = elements;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const listUrls = state.form.urls;
    const formData = new FormData(e.target);
    const responseUrl = formData.get('url');
    const message = validate(responseUrl, listUrls);
    if (message) {
      watchedState.form.field = {
        message,
        valid: false,
      };
      return;
    }
    watchedState.form.field = {
      message,
      valid: true,
    };
    watchedState.form.status = 'sending';
    const loadRss = (response) => {
      const parsedPosts = parsData(response);
      updateCollection(parsedPosts, state.posts, watchedState.posts);
      elements.postsField.addEventListener('click', (val) => {
        const { target } = val;
        const { id } = target.dataset;
        watchedState.currentId = id;
        touchElements(watchedState.posts, id);
      });
      watchedState.form.status = 'rendering';
    };
    getRequest(responseUrl)
      .then((response) => {
        const responseXML = toResponseXML(response);
        const rss = responseXML.querySelector('rss');
        if (!rss) throw new Error('Страница не найдена');
        watchedState.form.urls.push(responseUrl);
        watchedState.form.field = {
          message: i18n.t(alertPaths.success()),
          valid: true,
        };
        loadRss(responseXML);
        watchedState.form.status = 'filling';
      })
      .then(() => {
        const eternal = () => {
          const { urls } = state.form;
          urls.forEach((url) => {
            getRequest(url)
              .then((response) => {
                const responseXML = toResponseXML(response);
                console.log(responseXML);
                loadRss(responseXML);
              });
          });
          setTimeout(eternal, variables.interval());
        };
        setTimeout(eternal, variables.interval());
      })
      .catch((errors) => {
        if (errors.message === 'Страница не найдена') {
          watchedState.form.field = {
            message: i18n.t(alertPaths.invalidRssUrl()),
            valid: false,
          };
        } else {
          watchedState.form.field = {
            message: i18n.t(alertPaths.networkError()),
            valid: false,
          };
        }
        watchedState.form.status = 'failed';
        watchedState.form.urls.pop();
      });
  });
};
