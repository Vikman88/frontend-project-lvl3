import * as yup from 'yup';
import i18next from 'i18next';
import render from './render.js';
import resources from './locales';
import validate from './validator.js';
import getRequest from './sendRequest.js';
import { toResponseXML } from './utils.js';
import loadRss from './loadRSS.js';

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
      feedback: {
        message: null,
        valid: 'true',
      },
    },
    urls: [],
    posts: [],
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
        const responseXML = toResponseXML(response);
        const successful = loadRss(responseXML, state, watchedState, elements);
        if (!successful) {
          watchedState.form.feedback = {
            message: alertPaths.invalidRssUrl(),
            valid: 'false',
          };
        } else {
          watchedState.urls.push(responseUrl);
          watchedState.form.feedback = {
            message: alertPaths.success(),
            valid: 'true',
          };
        }
        watchedState.form.status = 'filling';
      })
      .then(() => {
        const eternal = () => {
          const { urls } = state;
          urls.forEach((url) => {
            getRequest(url).then((response) => {
              const responseXML = toResponseXML(response);
              loadRss(responseXML, state, watchedState, elements);
            });
          });
          setTimeout(eternal, interval);
        };
        setTimeout(eternal, interval);
      })
      .catch(() => {
        watchedState.form.feedback = {
          message: alertPaths.networkError(),
          valid: 'false',
        };
        watchedState.form.status = 'failed';
      });
  });
};
