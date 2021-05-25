import * as yup from 'yup';
import i18next from 'i18next';
import render from './render.js';
import resources from './locales';
import validate from './validator.js';
import getRequest from './sendRequest.js';
import createRSSFields from './createRSSFields.js';

const interval = 5000;

const alertPaths = {
  empty: () => 'form.messageAlert.empty',
  invalid: () => 'form.messageAlert.invalid',
  dublicate: () => 'form.messageAlert.dublicate',
  invalidRssUrl: () => 'networkAlert.invalidRssUrl',
  networkError: () => 'networkAlert.networkError',
  success: () => 'networkAlert.success',
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
          required: alertPaths.empty(),
          notOneOf: alertPaths.dublicate(),
        },
        string: {
          url: alertPaths.invalid(),
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
            valid: 'true',
          },
        },
        urls: [],
        posts: [],
        incId: 0,
        currentId: null,
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
            valid: 'false',
          };
          return;
        }
        watchedState.form.feedback = {
          message,
          valid: 'true',
        };
        watchedState.form.status = 'sending';
        getRequest(responseUrl)
          .then((response) => {
            createRSSFields(response, state, watchedState, elements);
            watchedState.urls.push(responseUrl);
            watchedState.form.feedback = {
              message: alertPaths.success(),
              valid: 'true',
            };
            watchedState.form.status = 'filling';
          })
          .then(() => {
            const eternal = () => {
              const { urls } = state;
              urls.forEach((url) => {
                getRequest(url).then((response) => {
                  createRSSFields(response, state, watchedState, elements);
                });
              });
              setTimeout(eternal, interval);
            };
            setTimeout(eternal, interval);
          })
          .catch((error) => {
            if (error.message === 'parsererror') {
              watchedState.form.feedback = {
                message: alertPaths.invalidRssUrl(),
                valid: 'false',
              };
            } else {
              watchedState.form.feedback = {
                message: alertPaths.networkError(),
                valid: 'false',
              };
            }
            watchedState.form.status = 'failed';
          });
      });
    });
};
