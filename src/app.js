import 'bootstrap';
import * as yup from 'yup';
import i18next from 'i18next';
import _ from 'lodash';
import render from './render.js';
import resources from './locales';
import validate from './validator.js';
import fetchData from './fetchData.js';
import parsingData from './parsingData.js';

const interval = 5000;

const addMetaData = (items) => items.forEach((item) => {
  item.id = _.uniqueId();
});

const updateCollection = (loadedRSS, view) => (responseRSS) => {
  const cloneStatePosts = _.cloneDeep(loadedRSS);
  const loadedlinks = cloneStatePosts.map(({ link }) => link);
  const index = loadedlinks.indexOf(responseRSS.link);
  const currentLoadedItems = cloneStatePosts[index].items;
  const newItems = _.differenceBy(responseRSS.items, currentLoadedItems, 'link');
  addMetaData(newItems);
  cloneStatePosts[index].items.unshift(...newItems);
  view.posts = cloneStatePosts;
};

export default () => {
  const i18n = i18next.createInstance();
  return i18n
    .init({
      lng: 'ru',
      debug: false,
      resources,
    })
    .then(() => {
      yup.setLocale({
        mixed: {
          required: 'form.messageAlert.empty',
          notOneOf: 'form.messageAlert.dublicate',
        },

        string: {
          max: 'form.messageAlert.big',
          url: 'form.messageAlert.invalid',
        },
      });
    })
    .then(() => {
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
          feedback: {
            message: null,
            statusForm: 'valid',
          },
        },
        urls: [],
        posts: [],
        uiState: {
          posts: new Set(),
          currentId: null,
        },
      };

      const view = render(state, elements, i18n);

      elements.postsField.addEventListener('click', (value) => {
        const { target } = value;
        const { id } = target.dataset;
        if (!_.isUndefined(id)) {
          const { posts } = view.uiState;
          if (!posts.has(id)) posts.add(id);
          view.uiState.currentId = id;
        }
      });

      const { form } = elements;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const listUrls = state.urls;
        const formData = new FormData(e.target);
        const responseUrl = formData.get('url');
        const message = validate(responseUrl, listUrls);
        if (message) {
          view.form.feedback = {
            message,
            statusForm: 'invalid',
          };
          return;
        }
        view.form.feedback = {
          message,
          statusForm: 'valid',
        };
        view.form.status = 'sending';
        fetchData(responseUrl)
          .then((response) => {
            const { contents } = response.data;
            const parsedPosts = parsingData(contents);
            addMetaData(parsedPosts.items);
            view.posts.push(parsedPosts);
            view.urls.push(responseUrl);
            view.form.feedback = {
              message: 'networkAlert.success',
              statusForm: 'valid',
            };
            view.form.status = 'filling';
          })
          .then(() => {
            const { urls } = state;
            const eternal = () => {
              const promises = urls.map(fetchData);
              const promise = Promise.all(promises);
              promise.then((response) => {
                const { posts } = state;
                const parsedPosts = response.map((item) => item.data.contents).map(parsingData);
                parsedPosts.forEach(updateCollection(posts, view));
              }).then(() => setTimeout(eternal, interval));
            };
            setTimeout(eternal, interval);
          })
          .catch((error) => {
            if (error.response) {
              view.form.feedback = {
                message: 'networkAlert.invalidRssUrl',
                statusForm: 'invalid',
              };
            } else {
              view.form.feedback = {
                message: 'networkAlert.networkError',
                statusForm: 'invalid',
              };
            }
            view.form.status = 'failed';
          });
      });
    });
};
