import * as yup from 'yup';
import axios from 'axios';
import i18n from 'i18next';
import crc32 from 'crc-32';
import render from './render.js';
import resources from './locales';

const variables = {
  proxy: () => 'https://hexlet-allorigins.herokuapp.com/raw?url=',
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

const compareData = (targetData, comparedData, state) => {
  const addedTitles = comparedData.map(({ title }) => title);
  if (addedTitles.includes(targetData.title)) {
    const findedIndexField = addedTitles.indexOf(targetData.title);
    console.log(findedIndexField);
    const findedField = comparedData[findedIndexField];
    console.log(findedField);
    const findedItems = findedField.items;
    console.log(findedItems);
    const findedIds = findedItems.map(({ id }) => id);
    console.log(findedIds);
    const targetItems = targetData.items;
    console.log(targetItems);
    const updatedItems = targetItems.reduce((acc, v) => {
      const currentId = v.id;
      if (!findedIds.includes(currentId)) acc.push(v);
      return acc;
    }, []);
    state[findedIndexField].items.unshift(...updatedItems);
  } else state.push(targetData);
};

const updateCollection = (collection, id) => {
  collection.forEach((feed) => {
    feed.items.forEach((post) => {
      if (post.id === parseInt(id, 10)) post.touched = true;
    });
  });
};

const getChildElements = (el) => {
  const title = el.querySelector('title').textContent;
  const link = el.querySelector('link').textContent;
  const description = el.querySelector('description').textContent;
  const result = { title, link, description };
  return result;
};

const parsData = (data) => {
  const itemsCollection = data.querySelectorAll('item');
  const items = Array.from(itemsCollection).reduce((acc, item) => {
    const childElements = getChildElements(item);
    childElements.id = hashCode(childElements.title);
    childElements.touched = false;
    return [...acc, childElements];
  }, []);
  const result = { ...getChildElements(data), items };
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
        idPost: 0,
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
        watchedState.form.urls.push(responseUrl);
        watchedState.form.status = 'sending';
        getRequest(responseUrl).then((response) => {
          const { responseXML } = response.request;
          const { status } = response;
          if (!responseXML) {
            watchedState.networkAlert = status === variables.goodStatus()
              ? i18n.t(alertPaths.invalidRssUrl())
              : i18n.t(alertPaths.networkError());
            watchedState.form.status = 'failed';
            watchedState.form.urls.pop();
            return;
          }

          const parsedPosts = parsData(responseXML);
          compareData(parsedPosts, state.posts, watchedState.posts);
          watchedState.networkAlert = i18n.t(alertPaths.success());
          watchedState.form.status = 'rendering';
          elements.postsField.addEventListener('click', (val) => {
            const { target } = val;
            const { id } = target.dataset;
            updateCollection(watchedState.posts, id);
          });
        });
        const rerender = (urls) => urls.forEach((url) => {
          getRequest(url).then((response) => {
            const { responseXML } = response.request;
            const parsedPosts = parsData(responseXML);
            compareData(parsedPosts, state.posts, watchedState.posts);
          });
        });
        watchedState.form.status = 'filling';

        const interval = variables.interval();
        const eternal = () => {
          rerender(state.form.urls);
          setTimeout(eternal, interval);
        };
        setTimeout(eternal, interval);
      });
    });
};