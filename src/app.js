import * as yup from 'yup';
import i18next from 'i18next';
import render from './render.js';
import resources from './locales';
import validate from './validator.js';
import fetchData from './fetchData.js';
import renderRSSFields from './renderRSSFields.js';

const interval = 5000;

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
          required: () => ({ key: 'form.messageAlert.empty' }),
          notOneOf: () => ({ key: 'form.messageAlert.dublicate' }),
        },

        string: {
          max: ({ max }) => ({ key: 'form.messageAlert.big', values: { max } }),
          url: () => ({ key: 'form.messageAlert.invalid' }),
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
        incId: 0,
        currentId: null,
        currentItem: null,
      };

      const watchedState = render(state, elements, i18n);

      const { form } = elements;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const listUrls = state.urls;
        const formData = new FormData(e.target);
        const responseUrl = formData.get('url');
        const message = validate(responseUrl, listUrls);
        if (message) {
          watchedState.form.feedback = {
            message,
            statusForm: 'invalid',
          };
          return;
        }
        watchedState.form.feedback = {
          message,
          statusForm: 'valid',
        };
        watchedState.form.status = 'sending';
        fetchData(responseUrl)
          .then((response) => {
            const { posts } = state;
            renderRSSFields(response, posts, watchedState, elements);
            watchedState.urls.push(responseUrl);
            watchedState.form.feedback = {
              message: 'networkAlert.success',
              statusForm: 'valid',
            };
            watchedState.form.status = 'filling';
          })
          .then(() => {
            const eternal = () => {
              const { urls } = state;
              urls.forEach((url) => {
                fetchData(url).then((response) => {
                  const { posts } = state;
                  renderRSSFields(response, posts, watchedState, elements);
                });
              });
              setTimeout(eternal, interval);
            };
            setTimeout(eternal, interval);
          })
          .catch((error) => {
            if (error.message === 'parsererror') {
              watchedState.form.feedback = {
                message: 'networkAlert.invalidRssUrl',
                statusForm: 'invalid',
              };
            } else {
              watchedState.form.feedback = {
                message: 'networkAlert.networkError',
                statusForm: 'invalid',
              };
            }
            watchedState.form.status = 'failed';
          });
      });
    });
};
